package uk.ac.ebi.biostudies.configuration;

/**
 * Created by ehsan on 23/02/2017.
 */
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import org.springframework.web.servlet.view.JstlView;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;
import uk.ac.ebi.biostudies.api.util.PublicRest;

@Configuration
@EnableWebMvc
@EnableSwagger2
@EnableAsync
@EnableScheduling
@ComponentScan(basePackages = "uk.ac.ebi.biostudies")
@PropertySource("classpath:scheduler.properties")
public class MvcConfig extends WebMvcConfigurerAdapter {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        AntPathMatcher matcher = new AntPathMatcher();
        matcher.setCaseSensitive(false);
        configurer.setPathMatcher(matcher);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("index");
        registry.addViewController("/about").setViewName("about");
        registry.addViewController("/about/*").setViewName("about");
        registry.addViewController("/help").setViewName("help");
        registry.addViewController("/help/*").setViewName("help");
        registry.addViewController("/submit").setViewName("submit");
        registry.addViewController("/submit/*").setViewName("submit");
        registry.addViewController("/zip").setViewName("zip");
        registry.addViewController("/zip/*").setViewName("zip");

        registry.addViewController("/studies").setViewName("search");
        registry.addViewController("/studies/*").setViewName("search");
        registry.addViewController("/studies/{accession:.+}").setViewName("detail");
        registry.addViewController("/studies/{accession:.+}/").setViewName("detail");
        registry.addViewController("/hecatos/studies/").setViewName("hecatos");
        registry.addViewController("/{^hecatos}/studies/").setViewName("search");
        registry.addViewController("/hecatos/studies").setViewName("hecatos");
        registry.addViewController("/{^hecatos}/studies").setViewName("search");
        registry.addViewController("/{project:.+}/studies/{accession:.+}").setViewName("detail");
        registry.addViewController("/{project:.+}/studies/{accession:.+}/").setViewName("detail");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/js/**").addResourceLocations("/js/").setCachePeriod(6000);
        registry.addResourceHandler("/css/**").addResourceLocations("/css/").setCachePeriod(6000);
        registry.addResourceHandler("/images/**").addResourceLocations("/images/").setCachePeriod(6000);
        registry.addResourceHandler("/fonts/**").addResourceLocations("/fonts/").setCachePeriod(6000);
    }

    @Bean
    public static PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer() {
        PropertySourcesPlaceholderConfigurer properties = new PropertySourcesPlaceholderConfigurer();

        properties.setLocation(new ClassPathResource( "scheduler.properties" ));
        properties.setIgnoreResourceNotFound(false);

        return properties;
    }

    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        viewResolver.setViewClass(JstlView.class);
        viewResolver.setPrefix("/jsp/");
        viewResolver.setSuffix(".jsp");
        return viewResolver;
    }

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.withMethodAnnotation(PublicRest.class))
                .paths(PathSelectors.any())
                .build();
    }

}