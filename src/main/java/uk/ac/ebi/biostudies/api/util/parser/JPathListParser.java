package uk.ac.ebi.biostudies.api.util.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.jayway.jsonpath.ReadContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import uk.ac.ebi.biostudies.api.util.Constants;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static uk.ac.ebi.biostudies.api.util.Constants.NA;

public class JPathListParser extends AbstractParser{
    private static final Logger LOGGER = LogManager.getLogger(JPathListParser.class.getName());

    @Override
    public String parse(Map<String, Object> valueMap, JsonNode submission, String accession, JsonNode fieldMetadataNode, ReadContext jsonPathContext) {
        Object result= NA;
        String indexKey = fieldMetadataNode.get(Constants.IndexEntryAttributes.NAME).asText();
        String fieldType="";
        try {
            String jsonPath = fieldMetadataNode.get(Constants.IndexEntryAttributes.JSON_PATH).asText();
            List resultData = new ArrayList();
            for (String jp: jsonPath.split(" OR ")) {
                resultData.addAll(jsonPathContext.read(jp));
            }

            fieldType = fieldMetadataNode.get(Constants.IndexEntryAttributes.FIELD_TYPE).asText();
            switch (fieldType) {
                case Constants.IndexEntryAttributes.FieldTypeValues.FACET:
                    result =  String.join (Constants.Facets.DELIMITER, resultData);
                    break;
                case Constants.IndexEntryAttributes.FieldTypeValues.LONG:
                    result = resultData.stream().collect(Collectors.counting());
                    break;
                default:
                    result =  String.join (" ", resultData);
                    break;
            }

        } catch (Exception e) {
            if(valueMap.containsKey(Constants.Fields.TYPE) && valueMap.getOrDefault(Constants.Fields.TYPE, "").toString().equalsIgnoreCase("project"))
                return "";
            if(indexKey.equalsIgnoreCase("author") || indexKey.equalsIgnoreCase("orcid"))
                return "";
            LOGGER.error("problem in parsing field:{} in {}", indexKey, accession);
        }
        valueMap.put(indexKey, result);
        return result.toString();
    }
}
