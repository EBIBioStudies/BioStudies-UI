package uk.ac.ebi.biostudies.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.security.MessageDigest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.lucene.analysis.core.KeywordAnalyzer;
import org.apache.lucene.document.*;
import org.apache.lucene.index.*;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.*;
import org.apache.lucene.util.BytesRef;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import uk.ac.ebi.biostudies.api.util.Constants;
import uk.ac.ebi.biostudies.api.util.LinkInfo;
import uk.ac.ebi.biostudies.config.IndexManager;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class TextMiningLinkUpdater {
    @Autowired
    IndexManager indexManager;
    @Autowired
    IndexService indexService;

    private static MessageDigest MESSAGE_DIGEST = null;

    private final Logger LOGGER = LogManager.getLogger(TextMiningLinkUpdater.class.getName());

    @Async
    public void receivedMessage(JsonNode msg) throws Exception {
        String accession = "";
        String fileName = "";
        try{
            QueryParser parser = new QueryParser(Constants.Fields.ACCESSION, new KeywordAnalyzer());
            accession = "s-e" + msg.get("ft_id").asText().toLowerCase();
            fileName = msg.get("filename").asText();

            Query documentQuery = parser.parse(Constants.Fields.ACCESSION + ":" + accession);
            TopDocs resultDocs = indexManager.getIndexSearcher().search(documentQuery, 1);
            Document ownerDoc = null;
            if(resultDocs.totalHits.value>0){
                ownerDoc = indexManager.getIndexReader().document(resultDocs.scoreDocs[0].doc);
            }
            if(ownerDoc!=null){
                List<LinkInfo> allLinks = LinkInfo.parseLinks(msg);
                addToMainIndex(ownerDoc, allLinks);
                addToLinkIndex(accession, fileName, allLinks);
                LOGGER.debug("accession: {} links are indexed properly", accession);
            }
            else {
                LOGGER.debug("accession: {} not found to add its related mined links", accession);
            }


        }catch (Exception exception){
            LOGGER.error("Problem in partial update of mined links for acc: {}", accession, exception);
        }
    }

    public void addToMainIndex(Document document, List<LinkInfo> allLinks) throws IOException {
        List<JsonNode> allNodes = new ArrayList<>();
        for(IndexableField field: document.getFields()) {
            JsonNode curNode = indexManager.getIndexEntryMap().get(field.name());
            if (curNode == null)
                continue;
            allNodes.add(curNode);
        }
        for(JsonNode curNode: allNodes){
            IndexableField field = document.getField(curNode.get(Constants.IndexEntryAttributes.NAME).asText());
            String fieldType = curNode.get(Constants.IndexEntryAttributes.FIELD_TYPE).asText();
            try {
                switch (fieldType) {
                    case Constants.IndexEntryAttributes.FieldTypeValues.UNTOKENIZED_STRING:
                        if (curNode.has(Constants.IndexEntryAttributes.SORTABLE) && curNode.get(Constants.IndexEntryAttributes.SORTABLE).asBoolean(false))
                            document.add(new SortedDocValuesField(String.valueOf(field.name()), new BytesRef(field.stringValue())));
                        break;
                    case Constants.IndexEntryAttributes.FieldTypeValues.LONG:
                        Long value = Long.valueOf(field.stringValue());
                        document.add(new SortedNumericDocValuesField(field.name(), value));
                        document.add(new LongPoint(field.name(),  value));
                        break;
                }
            } catch (Exception ex) {
                LOGGER.error("field name: {} doc accession: {}", field.name(), document.get(Constants.Fields.ACCESSION), ex);
            }
        }
        for(LinkInfo linkInfo: allLinks){
            document.add(new TextField(Constants.Fields.CONTENT, linkInfo.getValue().toLowerCase(), Field.Store.NO));
            document.add(new TextField(Constants.Fields.CONTENT, linkInfo.getLink(), Field.Store.NO));
            document.add(new TextField(Constants.Fields.CONTENT, linkInfo.getType(), Field.Store.NO));
        }

        indexManager.getIndexWriter().updateDocument(new Term(Constants.Fields.ID, document.get(Constants.Fields.ID)), document);
        indexManager.getIndexWriter().commit();

    }

    public void addToLinkIndex(String accession, String fileName, List<LinkInfo> allLinks) throws Exception{
        int counter = 0;
        if(MESSAGE_DIGEST==null)
            MESSAGE_DIGEST = MessageDigest.getInstance("MD5");
        byte[] digestKey = MESSAGE_DIGEST.digest((accession+fileName).getBytes("UTF-8"));
        String digestKeyStr = new String(digestKey, "UTF-8");
        TermQuery digestTermQuery = new TermQuery(new Term(Constants.File.DIGEST, digestKeyStr));
        long delNumber = indexManager.getLinkIndexWriter().deleteDocuments(digestTermQuery);
        indexManager.getLinkIndexWriter().commit();
        LOGGER.debug("{} old links are deleted", delNumber);
        for(LinkInfo linkInfo:allLinks){
            counter++;
            Document document = new Document();
            document.add(new StringField(Constants.Fields.ID, accession+"_"+counter, Field.Store.YES));
            document.add(new StringField(Constants.File.DIGEST, digestKeyStr, Field.Store.YES));
            document.add(new StringField(Constants.File.OWNER, accession, Field.Store.YES));
            document.add(new StringField(Constants.File.FILENAME, fileName, Field.Store.NO));
            document.add(new StringField(Constants.File.FILENAME, fileName.toLowerCase(), Field.Store.NO));
            document.add(new StoredField(Constants.File.FILENAME, fileName));
            document.add(new SortedDocValuesField(Constants.File.FILENAME, new BytesRef(fileName)));

            document.add(new StringField(Constants.Link.TYPE, linkInfo.getType(), Field.Store.NO));
            document.add(new StringField(Constants.Link.TYPE, linkInfo.getType().toLowerCase(), Field.Store.NO));
            document.add(new StoredField(Constants.Link.TYPE, linkInfo.getType()));
            document.add(new SortedDocValuesField(Constants.Link.TYPE, new BytesRef(linkInfo.getType())));

            document.add(new StringField(Constants.Link.URL, linkInfo.getLink(), Field.Store.YES));

            document.add(new StringField(Constants.Link.VALUE, linkInfo.getValue(), Field.Store.NO));
            document.add(new StringField(Constants.Link.VALUE, linkInfo.getValue().toLowerCase(), Field.Store.NO));
            document.add(new StoredField(Constants.Link.VALUE, linkInfo.getValue()));
            document.add(new SortedDocValuesField(Constants.Link.VALUE, new BytesRef(linkInfo.getValue())));

            indexManager.getLinkIndexWriter().addDocument(document);
        }
        indexManager.getLinkIndexWriter().commit();
        indexManager.refreshIndexSearcherAndReader();
    }
}
