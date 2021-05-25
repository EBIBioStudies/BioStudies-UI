package uk.ac.ebi.biostudies.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import uk.ac.ebi.biostudies.api.util.HttpTools;
import uk.ac.ebi.biostudies.auth.BioStudiesLogoutHandler;
import uk.ac.ebi.biostudies.auth.CustomRememberMeCookieService;
import uk.ac.ebi.biostudies.auth.RefererAuthenticationSuccessHandler;
import uk.ac.ebi.biostudies.auth.RestBasedAuthenticationProvider;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

@Configuration
@EnableWebSecurity
@ComponentScan("uk.ac.ebi.biostudies.config")
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private RestBasedAuthenticationProvider authProvider;
    @Autowired
    private CustomRememberMeCookieService customRememberMeCookieService;
    @Autowired
    private BioStudiesLogoutHandler bioStudiesLogoutHandler;

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(authProvider);
    }


    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable().anonymous().principal("guest").authorities("GUEST").and()
                .authorizeRequests().antMatchers("/api/v1/index/**").hasAuthority("SUPER_USER").and()
                .authorizeRequests().antMatchers("/**").permitAll()
                .and().formLogin().successHandler(new RefererAuthenticationSuccessHandler())
                .loginPage("/?login=true").usernameParameter("u").passwordParameter("p").permitAll()
                .and().logout().logoutUrl("/logout").deleteCookies("JSESSIONID").addLogoutHandler(bioStudiesLogoutHandler).logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK))
                .and().rememberMe().rememberMeServices(customRememberMeCookieService);


    }


}
