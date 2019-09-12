package uk.ac.ebi.biostudies.controller;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ebi.biostudies.api.util.HttpTools;
import uk.ac.ebi.biostudies.auth.Session;
import uk.ac.ebi.biostudies.auth.User;
import uk.ac.ebi.biostudies.auth.UserSecurityService;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;

/**
 * Created by ehsan on 15/03/2017.
 */

@RestController
public class Authentication {

    private Logger logger = LogManager.getLogger(Authentication.class.getName());


    @Autowired
    UserSecurityService users;

    @RequestMapping(value = "/auth")
    public void login(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String returnURL = request.getHeader(HttpTools.REFERER_HEADER);
        String username = request.getParameter("u");
        String password = request.getParameter("p");
        String remember = request.getParameter("r");

        boolean isLoginSuccessful = false;
        User authenticatedUser = users.login(username, password);
        isLoginSuccessful = authenticatedUser != null;
        // 31,557,600 is a standard year in seconds
        Integer maxAge = "on".equals(remember) ? 31557600 : null;

        if (isLoginSuccessful) {
            logger.info("Successfully authenticated user [{}]", username);
            HttpTools.setCookie(response, HttpTools.TOKEN_COOKIE, authenticatedUser.getToken(), maxAge);
            HttpTools.setCookie(response, HttpTools.AUTH_MESSAGE_COOKIE, null, 0);
        } else {
            HttpTools.setCookie(response, HttpTools.TOKEN_COOKIE, null, null);
            HttpTools.setCookie(response, HttpTools.AUTH_MESSAGE_COOKIE, URLEncoder.encode("Invalid username or password", "UTF-8"), 5);
        }

        sendRedirect(response, returnURL, isLoginSuccessful);
    }

    private void sendRedirect(HttpServletResponse response, String returnURL, boolean isSuccessful) throws IOException {
        if (null != returnURL) {
            if (isSuccessful && returnURL.matches("^http[:]//www(dev)?[.]ebi[.]ac[.]uk/.+")) {
                returnURL = returnURL.replaceFirst("^http[:]//", "https://");
            }
            logger.debug("Will redirect to [{}]", returnURL);
            response.sendRedirect(returnURL);
        } else {
            response.setContentType("text/plain; charset=UTF-8");
            // Disable cache no matter what (or we're fucked on IE side)
            response.addHeader("Pragma", "no-cache");
            response.addHeader("Cache-Control", "no-cache");
            response.addHeader("Cache-Control", "must-revalidate");
            response.addHeader("Expires", "Fri, 16 May 2008 10:00:00 GMT"); // some date in the past
        }
    }

    @RequestMapping(value = "/logout")
    public void logout(@CookieValue(HttpTools.TOKEN_COOKIE) String token, HttpServletRequest request, HttpServletResponse response) {
        try {
            User user = Session.getCurrentUser();
            logger.info("Logging out user [{}]", user.getLogin());
            users.logout();
            HttpTools.setCookie(response, HttpTools.TOKEN_COOKIE, null, 0);
            HttpTools.setCookie(response, HttpTools.AUTH_MESSAGE_COOKIE, null, 0);
            String returnURL = request.getHeader(HttpTools.REFERER_HEADER);
            sendRedirect(response, returnURL, true);
        } catch (Exception ex) {
            logger.error("logout exception", ex);
        }
    }
}
