/*
 * Copyright 2009-2016 European Molecular Biology Laboratory
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package uk.ac.ebi.biostudies.file;

import org.apache.commons.io.FileDeleteStrategy;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.pdfbox.tools.imageio.ImageIOUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.api.util.Constants;
import uk.ac.ebi.biostudies.config.IndexConfig;
import uk.ac.ebi.biostudies.file.download.IDownloadFile;
import uk.ac.ebi.biostudies.file.thumbnails.*;
import uk.ac.ebi.biostudies.service.FileDownloadService;
import uk.ac.ebi.biostudies.service.impl.FireService;

import javax.servlet.http.HttpServletResponse;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

@Service
public class Thumbnails implements InitializingBean, DisposableBean {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    IndexConfig indexConfig;
    @Autowired
    FileDownloadService fileDownloadService;
    @Autowired
    FireService fireService;

    private String thumbnailsFolder;
    private Map<String, IThumbnail> thumbnailGenerators = new HashMap<>();

    @Override
    public void afterPropertiesSet() {
        //register thumbnail generators
        //TODO: use ServiceLoader or annotations instead
        registerThumbnailHandler(new ImageThumbnail());
        registerThumbnailHandler(new PDFThumbnail());
        registerThumbnailHandler(new DOCXThumbnail());
        registerThumbnailHandler(new TXTThumbnail());
        registerThumbnailHandler(new HTMLThumbnail());
    }

    private void registerThumbnailHandler(IThumbnail thumbnailHandler) {
        for (String mimeType : thumbnailHandler.getSupportedTypes()) {
            thumbnailGenerators.put(mimeType, thumbnailHandler);
        }
    }


    public synchronized String getThumbnailsFolder() {
        if (null == this.thumbnailsFolder) {
            this.thumbnailsFolder = indexConfig.getThumbnailDir();
        }
        return this.thumbnailsFolder;
    }

    public synchronized void clearThumbnails() throws IOException {
        FileDeleteStrategy.FORCE.delete(new File(getThumbnailsFolder()));
    }

    public void sendThumbnail(HttpServletResponse response, String accession, String relativePath, String name, Constants.File.StorageMode storageMode) throws IOException {
        String fileType = FilenameUtils.getExtension(name).toLowerCase();
        InputStream thumbnailInputStream = null;
        try {
            // check in the Thumbnails folder in storage
            IDownloadFile existingThumbnail = fileDownloadService.getDownloadFile(accession, relativePath + "/Thumbnails", name + ".thumbnail.png", storageMode);
            thumbnailInputStream = existingThumbnail.getInputStream();
        } catch (Exception ex1) {
            File cachedThumbnail = new File(getThumbnailsFolder() + "/" + relativePath + "/", name + ".thumbnail.png");
            if (!cachedThumbnail.exists()) {
                // create thumbnail in cache

                if (hasThumbnailsFolder(accession, relativePath, storageMode)) {
                    // send a transparent gif to cache if there's no pre-generated thumbnail
                    byte[] transparentPNG = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
                            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x04, 0x00,
                            0x00, 0x00, (byte) 0xb5, 0x1c, 0x0c, 0x02, 0x00, 0x00, 0x00, 0x0b, 0x49, 0x44, 0x41, 0x54,
                            0x78, (byte) 0xda, 0x63, 0x64, 0x60, 0x00, 0x00, 0x00, 0x06, 0x00, 0x02, 0x30, (byte) 0x81,
                            (byte) 0xd0, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, (byte) 0xae, 0x42, 0x60,
                            (byte) 0x82};
                    cachedThumbnail.getParentFile().mkdirs();
                    logger.debug("Creating empty thumbnail " + cachedThumbnail.getAbsolutePath());
                    try (var outputStream = new FileOutputStream(cachedThumbnail.getAbsolutePath())) {
                        IOUtils.write(transparentPNG, outputStream);
                    }

                } else {
                    // create thumbnail from file
                    try {
                        IDownloadFile downloadFile = fileDownloadService.getDownloadFile(accession, relativePath, name, storageMode);
                        createThumbnail(downloadFile.getInputStream(), fileType, cachedThumbnail);
                    } catch (Exception ex3) {
                        logger.debug("Will try to create placeholder now");
                        createPlaceholderThumbnail(fileType, cachedThumbnail);
                    }
                }
            }
            thumbnailInputStream = new FileInputStream(cachedThumbnail);
        }

        try {
            response.setContentType("image/png");
            IOUtils.copy(thumbnailInputStream, response.getOutputStream());
        } finally {
            if (thumbnailInputStream != null) {
                thumbnailInputStream.close();
            }
        }
        response.getOutputStream().flush();
    }

    private void createPlaceholderThumbnail(String fileType, File thumbnailFile) throws IOException {
        synchronized (thumbnailFile.getAbsolutePath()) {
            thumbnailFile.getParentFile().mkdirs();
            //Using extension to decide on the class as mime-types are different across *nix/Windows
            logger.debug("Creating placeholder thumbnail [{}] for file type {}", thumbnailFile.getAbsolutePath(), fileType);
            int imageWidth = 50, imageHeight = 65;
            BufferedImage image = new BufferedImage(imageWidth, imageHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, imageWidth, imageHeight);
            g.setColor(Color.BLACK);
            g.setFont(new Font("sans-serif", Font.PLAIN, 12));
            int stringLen = (int) g.getFontMetrics().getStringBounds(fileType, g).getWidth();
            int start = imageWidth / 2 - stringLen / 2;
            g.drawString(fileType, start, imageHeight / 2);
            ImageIOUtil.writeImage(image, thumbnailFile.getAbsolutePath(), 96);
        }
    }

    private void createThumbnail(InputStream fileInputStream, String fileType, File thumbnailFile) throws IOException {
        synchronized (thumbnailFile.getAbsolutePath()) {
            thumbnailFile.getParentFile().mkdirs();
            //Using extension to decide on the class as mime-types are different across *nix/Windows
            if (thumbnailGenerators.containsKey(fileType)) {
                try {
                    thumbnailGenerators.get(fileType).generateThumbnail(fileInputStream, thumbnailFile);
                } catch (Throwable err) {
                    logger.debug("Error creating thumbnail: ", err.getMessage());
                }
            } else {
                logger.debug("Invalid file type for creating thumbnail: {}", fileType);
                throw new IOException("Invalid file type for creating thumbnail");
            }
        }
    }

    public boolean hasThumbnailsFolder(String accession, String relativePath, Constants.File.StorageMode storageMode) {
        boolean thumbnailFolderExists = false;
        if (storageMode == Constants.File.StorageMode.NFS) {
            File file = new File(indexConfig.getFileRootDir() + "/" + relativePath + "/Thumbnails/");
            thumbnailFolderExists = file.exists();
        } else {
            thumbnailFolderExists = fireService.isValidFolder(relativePath + "/Thumbnails/");
        }
        return thumbnailFolderExists;
    }

    @Override
    public void destroy() {

    }
}
