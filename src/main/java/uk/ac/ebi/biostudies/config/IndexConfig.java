package uk.ac.ebi.biostudies.config;

import org.apache.lucene.analysis.CharArraySet;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import uk.ac.ebi.biostudies.api.util.Constants;

import java.util.Arrays;
import java.util.List;

/**
 * Created by ehsan on 27/02/2017.
 */

@Configuration
@PropertySource("classpath:index.properties")
public class IndexConfig implements InitializingBean, DisposableBean {

    @Value("${index.directory}")
    private String indexDirectory;

    @Value("${index.file-index}")
    private String fileIndexDirectory;

    @Value("${index.facetDirectory}")
    private String facetDirectory;

    @Value("${files.baseDirectory}")
    private String baseDirectory;

    @Value("${files.submissionsDirectory}")
    private String submissionsDirectory;

    @Value("${indexer.threadCount}")
    private int threadCount;

    @Value("${indexer.queueSize}")
    private int queueSize;

    @Value("${index.fields}")
    private String indexFields;

    @Value("${index.defaultField}")
    private String defaultField;

    @Value("${index.searchSnippetFragmentSize}")
    private int searchSnippetFragmentSize;

    @Value("${files.thumbnailsDirectory}")
    private String thumbnailDir;

    @Value("${files.ftpUrl}")
    private String ftpDir;

    @Value("${indexer.stopwords}")
    private String stopwords;

    @Value("${index.spellcheckerDirectory}")
    private String spellcheckerLocation;

    @Value("${indexer.queryTypeFilter}")
    private String typeFilterQuery;

    @Value("${default.collection.list}")
    private List<String> defaultCollectionList;

    @Value("${index.backup.directory}")
    private String indexBackupDirectory;

    @Value("${index.sync.command}")
    private String indexSyncCommand;

    @Value("${index.api.enabled}")
    private boolean apiEnabled;

    public static CharArraySet STOP_WORDS;


    @Override
    public void afterPropertiesSet() {
        STOP_WORDS =  new CharArraySet(Arrays.asList(stopwords.split(",")), false);
    }


    public int getThreadCount() {
        return threadCount;
    }

    public String getIndexDirectory() {
        return indexDirectory;
    }

    public String getFacetDirectory() {
        return facetDirectory;
    }

    public String getStudiesInputFile() {
        return baseDirectory + "updates/" + Constants.SUBMISSIONS_JSON;
    }

    public String getDefaultField() {
        return defaultField;
    }

    public int getSearchSnippetFragmentSize() {
        return searchSnippetFragmentSize;
    }



    public String[] getIndexFields(){
        String[] fields = indexFields.split(",");
        return fields;
    }

    public String getThumbnailDir() {
        return thumbnailDir;
    }

    public String getFileRootDir() {
        return baseDirectory + submissionsDirectory;
    }

    public String getFtpDir() {
        return ftpDir;
    }

    public int getQueueSize(){
        return queueSize;
    }

    public String getSpellcheckerLocation() {
        return spellcheckerLocation;
    }

    public String getTypeFilterQuery() {
        return typeFilterQuery;
    }

    public List<String> getDefaultCollectionList() {
        return defaultCollectionList;
    }

    @Override
    public void destroy() {

    }

    public String getIndexBackupDirectory() {
        return indexBackupDirectory;
    }

    public String getIndexSyncCommand() {
        return indexSyncCommand;
    }

    public boolean isApiEnabled() {
        return apiEnabled;
    }

    public String getFileIndexDirectory() {
        return fileIndexDirectory;
    }
}
