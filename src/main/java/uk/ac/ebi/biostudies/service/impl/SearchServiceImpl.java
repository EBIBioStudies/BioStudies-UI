package uk.ac.ebi.biostudies.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import uk.ac.ebi.biostudies.api.BioStudiesField;
import uk.ac.ebi.biostudies.api.util.BioStudiesQueryParser;
import uk.ac.ebi.biostudies.api.util.StudyUtils;
import uk.ac.ebi.biostudies.efo.EFOExpandedHighlighter;
import uk.ac.ebi.biostudies.efo.EFOQueryExpander;
import uk.ac.ebi.biostudies.lucene.config.IndexConfig;
import uk.ac.ebi.biostudies.service.SearchService;
import uk.ac.ebi.biostudies.lucene.config.IndexManager;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by ehsan on 27/02/2017.
 */

@Service
@Scope("singleton")
public class SearchServiceImpl implements SearchService {

    private Logger logger = LogManager.getLogger(SearchServiceImpl.class.getName());

    @Autowired
    IndexConfig indexConfig;

    @Autowired
    IndexManager indexManager;

    @Autowired
    EFOQueryExpander efoQueryExpander;
    @Autowired
    EFOExpandedHighlighter efoExpandedHighlighter;

//    public void tempInit(){
//        BooleanQuery.Builder synonymBooleanBuilder = new BooleanQuery.Builder();
//        BooleanQuery.Builder efoBooleanBuilder = new BooleanQuery.Builder();
//        Map<String, String> data = new HashMap<>();
//        data.put("content","content");
//        QueryParser parser = new QueryParser("content", new StandardAnalyzer());
//        Query query = null;
//        try {
//            query = parser.parse("organisation");
//            Query bquery = efoQueryExpander.expand(data, query, synonymBooleanBuilder, efoBooleanBuilder);
//            logger.debug("hi");

//            String result = efoExpandedHighlighter.highlightQuery(query, synonymBooleanBuilder.build(), efoBooleanBuilder.build(), "content", "the organisation text that should be highlight", false);
//            logger.debug(result);
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }

    @Override
    public String highlightText(Query originalQuery, Query synonymQuery, Query efoQuery, String fieldName, String text, boolean fragmentOnly){
        String result = efoExpandedHighlighter.highlightQuery(originalQuery, synonymQuery, efoQuery, fieldName, text, fragmentOnly);
        return result;
    }

    @Override
    public Query expandQuery(Map<String, String> queryInfo, Query originalQuery, BooleanQuery.Builder synonymBooleanBuilder, BooleanQuery.Builder efoBooleanBuilder){
        if(queryInfo==null) {
            queryInfo = new HashMap<>();
            queryInfo.put("content","content");
        }
        try {
            originalQuery = efoQueryExpander.expand(queryInfo, originalQuery, synonymBooleanBuilder, efoBooleanBuilder);
        }catch (Exception ex){
            logger.error("problem in expanding query {}", originalQuery, ex);
        }
        return originalQuery;
    }

    @Override
    public String search(String queryString, int page, int pageSize) {

        IndexReader reader = indexManager.getIndexReader();
        IndexSearcher searcher = indexManager.getIndexSearcher();
        String[] fields = indexConfig.getIndexFields();
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();

        if (StringUtils.isEmpty(queryString))  {
            queryString = "*:*";
        } else {
            response.put("query", queryString);
        }
        Analyzer analyzer = new StandardAnalyzer();
        QueryParser parser = new BioStudiesQueryParser(fields, analyzer);

        try {
            logger.debug("User queryString: {}",queryString);
            Query query = parser.parse(queryString);
            logger.debug("Lucene query: {}",query.toString());
            TopDocs hits = searcher.search(query, reader.numDocs());
            int hitsPerPage = pageSize;
            int to = page * hitsPerPage > hits.totalHits ? hits.totalHits : page * hitsPerPage;
            response.put("page", page);
            response.put("pageSize", hitsPerPage);
            response.put("totalHits", hits.totalHits);
            if (hits.totalHits > 0) {
                ArrayNode docs = mapper.createArrayNode();
                for (int i = (page - 1) * hitsPerPage; i < to; i++) {
                    ObjectNode docNode = mapper.createObjectNode();
                    Document doc = reader.document(hits.scoreDocs[i].doc);
                    for (BioStudiesField field : BioStudiesField.values()) {
                        if (!field.isRetrieved()) continue;
                        switch (field.getType()) {
                            case LONG:
                                docNode.put(String.valueOf(field), Long.parseLong(doc.get(field.toString())));
                                break;
                            default:
                                docNode.put(String.valueOf(field), doc.get(field.toString()));
                                break;
                        }
                    }

                    docNode.put("isPublic",
                            (" " + doc.get(String.valueOf(BioStudiesField.ACCESS) + " ")).toLowerCase().contains(" public ")
                    );
                    docs.add(docNode);
                }
                response.set("hits", docs);
                logger.debug(hits.totalHits + " hits");
            }
        }
        catch(Throwable error){
            logger.error("problem in searching this query {}", queryString, error);
        }

        return  response.toString();
    }

    @Override
    public String getDetailFile(String accessionNumber) throws IOException {
        String path = StudyUtils.getPartitionedPath(accessionNumber);
        File file = new File(indexConfig.getRepositoryPath() + path + "/"+accessionNumber+".json");
        if (!file.exists()) {
            throw new FileNotFoundException("Study "+accessionNumber+" not found!");        }
        int length = (int)file.length();
        FileInputStream reader  = new FileInputStream(file);
        byte[] buff = new byte[length];
        reader.read(buff);
        String result = new String(buff, "UTF-8");
        return result;
    }
}
