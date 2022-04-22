package uk.ac.ebi.biostudies.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class View {
    private final Logger logger = LogManager.getLogger(View.class.getName());

    @RequestMapping(value = "/")
    public ModelAndView index() throws Exception {
        var mav = new ModelAndView();
        mav.setViewName("index");
        return mav;
    }

    @RequestMapping(value = {
            "/studies/help",
            "/studies/help/",
            "/{collection}/help",
            "/{collection}/help/",
            "/{collection}/.+/help",
            "/{collection}/.+/help/"
    })
    public ModelAndView help() throws Exception {
        var mav = new ModelAndView();
        mav.setViewName("help");
        return mav;
    }

    @RequestMapping(value = {
            "/studies",
            "/studies/",
            "/{collection}/studies",
            "/{collection}/studies/"
    }, method = RequestMethod.GET)
    public ModelAndView search(@PathVariable(required = false) String collection) throws Exception {
        var mav = new ModelAndView();
        mav.addObject("collection", collection);
        mav.setViewName("search");
        return mav;
    }

    @RequestMapping(value = {
            "/studies/{accession}",
            "/studies/{accession}/",
            "/{collection}/studies/{accession}",
            "/{collection}/studies/{accession}/"
    }, method = RequestMethod.GET)
    public ModelAndView detail(@PathVariable(required = false) String collection,
                               @PathVariable(value = "accession") String accession) throws Exception {
        var mav = new ModelAndView();
        mav.addObject("collection", collection);
        mav.addObject("accession", accession);
        mav.setViewName("detail");
        return mav;
    }

    @RequestMapping(value = {
            "/studies/{accession}/{view}",
            "/studies/{accession}/{view}/",
            "/{collection}/studies/{accession}/{view}",
            "/{collection}/studies/{accession}/{view}/"
    }, method = RequestMethod.GET)
    public ModelAndView genericStudyView(@PathVariable(required = false) String collection,
                                         @PathVariable String accession,
                                         @PathVariable String view) throws Exception {
        var mav = new ModelAndView();
        mav.addObject("collection", collection);
        mav.addObject("accession", accession);
        mav.setViewName(view);
        return mav;
    }

    @RequestMapping(value = {
            "/{view}",
            "/{view}/",
    }, method = RequestMethod.GET)
    public ModelAndView genericView(@PathVariable String view) throws Exception {
        var mav = new ModelAndView();
        mav.setViewName(view);
        return mav;
    }

    @RequestMapping(value = {"/{collection}/studies/EMPIAR-{id:.+}", "/studies/EMPIAR-{id:.+}"})
    public RedirectView redirectEMPIAR(@PathVariable(required = false) String collection, @PathVariable String id) {
        RedirectView redirectView = new RedirectView();
        redirectView.setUrl("https://www.ebi.ac.uk/empiar/" + id);
        return redirectView;
    }

}