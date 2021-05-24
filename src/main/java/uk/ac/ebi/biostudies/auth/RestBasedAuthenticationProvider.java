package uk.ac.ebi.biostudies.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.config.SecurityConfig;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class RestBasedAuthenticationProvider implements AuthenticationProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(RestBasedAuthenticationProvider.class);

    @Autowired
    private SecurityConfig securityConfig;
    @Autowired
    UserSecurityService userSecurityService;

    private static int REQUEST_TIMEOUT = 30000;
    private static ObjectMapper mapper = new ObjectMapper();

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if(authentication.isAuthenticated())
            return authentication;
        String name = authentication.getName();
        String password = authentication.getCredentials().toString();
        Authentication  authenticatedUser = null;
        try {
            JsonNode secResponse = sendLoginRequest(name, password);
            User user  = userSecurityService.createUserFromJSONResponse(secResponse);
            if(user!=null&&user.getToken()!=null){
                List<GrantedAuthority> grantedAuths = new ArrayList();
                if(user.isSuperUser())
                    grantedAuths.add(new SimpleGrantedAuthority("POWER_USER"));
                return new UsernamePasswordAuthenticationToken(user, password, user.getAuthorities() );
            }

        }catch (Throwable exception){
            LOGGER.debug("problem in sending login request to auth server", exception);
        }
        return authenticatedUser;
    }

    @Override
    public boolean supports(Class<?> aClass) {
        return aClass.equals(UsernamePasswordAuthenticationToken.class);

    }

    public static void main(String args[]){
        try {
            sendLoginRequest("manager", "m4n4g3r");
        }catch (Exception ex){}
    }

    public static JsonNode sendLoginRequest(String username, String password) throws Exception {
        JsonNode responseJSON = null;
        CloseableHttpClient httpclient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(/**securityConfig.getLoginUrl()*/"http://biostudy-dev:8788/auth/signin");
        httpPost.setConfig(RequestConfig.custom()
                .setConnectionRequestTimeout(REQUEST_TIMEOUT)
                .setConnectTimeout(REQUEST_TIMEOUT)
                .setSocketTimeout(REQUEST_TIMEOUT).build());
        httpPost.setHeader("Content-Type", "application/json; charset=UTF-8");
        ObjectNode creds = mapper.createObjectNode();
        creds.put("login", username);
        creds.put("password", password);
        httpPost.setEntity(new StringEntity(mapper.writeValueAsString(creds)));
        try (CloseableHttpResponse response = httpclient.execute(httpPost)) {
            responseJSON = mapper.readTree(EntityUtils.toString(response.getEntity()));
        } catch (Exception exception) {
            LOGGER.error("problem in sending http req to authentication server", exception);
            throw exception;
        }
        return responseJSON;
    }
}