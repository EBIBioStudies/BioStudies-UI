$(function() {
    const specialCollections = ['bioimages', 'arrayexpress'];

    function updateMenuForCollection(data) {
        if ($.inArray(collection.toLowerCase(), specialCollections)<0 &&
            $('#masthead nav ul.menu li.active a').text().toLowerCase()==='browse') {
            $('#masthead nav ul.float-left li').removeClass('active');
            $('#masthead nav ul.float-left li').eq(1).after('<li class="active"><a href="'
                + (contextPath + '/' + data.accno + '/' + 'studies')
                + '" title="' + data.title
                + '">' + data.title + '</a></li>');
        }
    }

    function showCollectionBanner(data) {
        var templateSource = $('script#collection-banner-template').html();
        var template = Handlebars.compile(templateSource);
        var collectionObj={};
        try {
            collectionObj = {accno : data.accno , logo: contextPath + '/files/' + data.accno + '/' + data.section.files[0][0].path};
        } catch(e){}
        $(data.section.attributes).each(function () {
            collectionObj[this.name.toLowerCase()] = this.value
        })
        collectionObj.title = collectionObj.title || collectionObj.accno;
        var html = template(collectionObj);
        if (collection.toLowerCase()!='bioimages') {
            $('#collection-banner').html(html);
        }
        // add collection search checkbox
        $('#example').append('<label id="collection-search"'+ ( $.inArray(collection.toLowerCase(), specialCollections)>=0 ? 'style="display:none;"' : '')
            +'><input id="search-in-collection" type="checkbox" />Search in '+collectionObj.title+' only</label>');
        $('#search-in-collection').bind('change', function(){
            $('#ebi_search').attr('action', ($(this).is(':checked')) ? contextPath+'/'+data.accno.toLowerCase()+'/studies' : contextPath+'/studies');
        });
        $('#search-in-collection').click();
        //fix breadcrumbs
        $('ul.breadcrumbs').children().first().next().html('<a href="'+contextPath+'/'+collection+'/studies">'+collectionObj.title+'</a>')
        updateTitleFromBreadCrumbs();
        return collectionObj;
    }


    $.ajaxSetup({
        cache: true
    });

    handleProjectSpecificUI();

    $('#login-button').click(function () {
        showLoginForm();
    });
    $('.popup-close').click(function () {
        $(this).parent().parent().hide();
    });
    $('#logout-button').click(function () {
        $('#logout-form').submit();
    });
    $('.sample-query').click(function () {
        $('#query').val($(this).text());
        $('#ebi_search').submit();
    });
    var message = $.cookie("BioStudiesMessage");
    if (message) {
        $('#login-status').text(message).show();
        showLoginForm();
    }
    /*var login = $.cookie("BioStudiesLogin");
    if (login) {
        $('#user-field').attr('value', login);
        $('#pass-field').focus();
    }*/

    if (collection && collection!=='collections') {
        // display collection banner
        $.getJSON(contextPath + "/api/v1/collections/" + collection, function (data) {
            if (!data || !data.section || !data.section.type ||
                (data.section.type.toLowerCase()!='collection' && data.section.type.toLowerCase()!='project'))
                return;
            var collectionObj = showCollectionBanner(data);
            updateMenuForCollection(collectionObj);
        }).fail(function (error) {
            //showError(error);
        });
    }

    var autoCompleteFixSet = function () {
        $(this).attr('autocomplete', 'off');
    };
    var autoCompleteFixUnset = function () {
        $(this).removeAttr('autocomplete');
    };

    $("#query").autocomplete(
        contextPath + "/api/v1/autocomplete/keywords"
        , {
            matchContains: false
            , selectFirst: false
            , scroll: true
            , max: 50
            , requestTreeUrl: contextPath + "/api/v1/autocomplete/efotree"
        }
    ).focus(autoCompleteFixSet).blur(autoCompleteFixUnset).removeAttr('autocomplete');
    updateTitleFromBreadCrumbs();
});

function handleProjectSpecificUI(){
    if (collection && collection.toLowerCase()=='bioimages') {
        handleBioImagesUI();
    } else if (collection && collection.toLowerCase()=='arrayexpress') {
        handleArrayExpressUI();
    }
}

function handleBioImagesUI() {
    $('#local-title').html('<div style="padding:1em; width:86%; line-height:0; background-color:white;opacity: 0.9;"><section style="display: flex; gap: 10px;"><div>' +
        '<img src="https://uk1s3.embassy.ebi.ac.uk/bia-integrator-data/pages/assets/BIA-Logo.png" style="width:80px"></div>' +
        '<div><h2 style="font-size: 42px; color: #1a1c1a; font-weight: 700; line-height: 1" >BioImage Archive</h2>' +
        '<span style="font-size:21px; font-weight: 500; line-height: 1.29; color: #1a1c1a; ">A resource for open, FAIR life science imaging data</span>' +
        '</div></section></div>');
    $('#masthead').css({"background-image":"url("+contextPath +"/images/collections/bioimages/background.png)","background-position":"center center"});
    $('.masthead, #ebi_search .button, .pagination .current').css("background-color","rgb(0, 124, 130)");
    $('.menu.float-left li a:contains("Home")').attr('href','/bioimage-archive/');
    $('.menu.float-left li a:contains("Browse")').attr('href','/biostudies/BioImages/studies');
    $('.menu.float-left li a:contains("Submit")').attr('href','/bioimage-archive/submit');
    
    // Add Galleries menu Item
    const galleriesmenu = $('<li role="none">' +
        '                       <a href="/bioimage-archive/galleries/galleries.html" role="menuitem">Galleries</a>' +
        '                    </li>');
    $('.menu.float-left li a:contains("Submit")').parent().after(galleriesmenu);

    const helpmenu = $('.menu.float-left li:contains("Help")');
    const newhelpmenu = $('<li role="none" class="is-dropdown-submenu-parent opens-right" aria-haspopup="true" aria-label="Help" data-is-click="false">\n' +
        '                            <a href="#" role="menuitem">Help</a>\n' +
        '                            <ul class="menu submenu is-dropdown-submenu first-sub vertical" data-submenu="" role="menubar" style="">\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-faq" role="menuitem">FAQs</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-search/" role="menuitem">Searching the archive</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-download/" role="menuitem">Downloading data</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-file-list/" role="menuitem">Submission File List guide</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-tools/" role="menuitem">Supporting Tools</a></li>\n' +
        '                            </ul>\n' +
        '                        </li>');
    helpmenu.replaceWith(newhelpmenu);
    const rembimenu = $('<li role="none" class="is-dropdown-submenu-parent opens-right" aria-haspopup="true" aria-label="REMBI Help" data-is-click="false">\n' +
        '                            <a href="#" role="menuitem">REMBI Help</a>\n' +
        '                            <ul class="menu submenu is-dropdown-submenu first-sub vertical" data-submenu="" role="menubar" style="">\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/rembi-help-overview" role="menuitem">REMBI Overview</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/rembi-help-lab/" role="menuitem">REMBI Lab Guidance</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/rembi-help-examples/" role="menuitem">Study Component Guidance</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/rembi-model-reference/" role="menuitem">REMBI Model Reference</a></li>\n' +
        '                            </ul>\n' +
        '                        </li>');
    newhelpmenu.after(rembimenu);

    const policiesmenu = $('<li role="none" class="is-dropdown-submenu-parent opens-right" aria-haspopup="true" aria-label="Policies" data-is-click="false">\n' +
        '                            <a href="#" role="menuitem">Policies</a>\n' +
        '                            <ul class="menu submenu is-dropdown-submenu first-sub vertical" data-submenu="" role="menubar" style="">\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-policies/" role="menuitem">Archive policies</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/help-images-at-ebi/" role="menuitem">Depositing image data to EBI resources</a></li>\n' +
        '                            </ul>\n' +
        '                        </li>');
    rembimenu.after(policiesmenu);

    const about = $('.menu.float-left li:contains("About")')
    const newaboutmenu = $('<li role="none" class="is-dropdown-submenu-parent opens-right" aria-haspopup="true" aria-label="About us" data-is-click="false">\n' +
        '                            <a href="#" role="menuitem">About us</a>\n' +
        '                            <ul class="menu submenu is-dropdown-submenu first-sub vertical" data-submenu="" role="menubar" style="">\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/project-developments/" role="menuitem">Project developments</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/case-studies/" role="menuitem">Case Studies</a></li>\n' +
        '                                <li role="none" class="is-submenu-item is-dropdown-submenu-item"><a href="/bioimage-archive/contact-us" role="menuitem">Contact us</a></li>\n' +
        '                            </ul>\n' +
        '                        </li>');
    about.replaceWith(newaboutmenu);

    $('#masthead nav').attr('id','bia-nav');
    $('#bia-nav').appendTo(($('header').parent()))
    $('#bia-nav').css({'max-width': '81.25em', 'margin-right': 'auto', 'margin-left' : 'auto', 'display': 'flex', 'padding-bottom':'0pt'})
    $('#bia-nav .dropdown.menu > li.is-dropdown-submenu-parent > a::after').css('border','none')
    $('#bia-nav .dropdown.menu > li > a').css({'font-size': '19px', 'font-weight': '400', 'color':'#1a1c1a', 'border-bottom':'none', 'padding':'0.7rem 0.3rem'})
    $('#bia-nav').parent().append('<hr style="padding: 0;line-height: 0;margin: 6px auto;width: 69%; border-style:revert;border-width: 1px;">')
    $('.masthead-inner').css('padding-top','2em')
    $('div#local-title').css('margin-bottom','2.3em')


    new Foundation.DropdownMenu(newhelpmenu.parent());
    $('#query').attr('placeholder','Search BioImages');
    $('.sample-query').first().text('brain');
    $('.sample-query').first().next().text('microscopy');
    $('#elixir-banner').hide();
}

function handleArrayExpressUI() {
    //$('#local-title').html('<h1><img src="' + contextPath + '/images/collections/arrayexpress/ae-logo-64.svg"></img><span style="font-weight:lighter;padding-left: 4pt;vertical-align:bottom;">ArrayExpress</span></h1>');
    //$('#masthead').css("background-color","#5E8CC0");
    $('#query').attr('placeholder','Search ArrayExpress');
    $('.sample-query').first().text('E-MEXP-31');
    $('.sample-query').first().next().text('cancer');
    $('.menu.float-left li:contains("Home") a').attr('href',contextPath + '/arrayexpress');
    $('.menu.float-left li:contains("Browse") a').text('ArrayExpress').attr('href',contextPath + '/arrayexpress/studies');
    $('.menu.float-left li:contains("Submit") a').attr('href','/fg/annotare');
    $('.menu.float-left li:contains("Home")').after('<li role="none"><a href="'+ contextPath + '" role="menuitem">BioStudies</a></li>');
    $('span.elixir-banner-name').text('This service');
    $('span.elixir-banner-description').text('ArrayExpress is an ELIXIR Core Data Resource');
}


function updateTitleFromBreadCrumbs() {
    //update title
    var breadcrumbs = $('.breadcrumbs li').map(function  () { return $(this).text().replaceAll('Current:','').trim(); }).get().reverse();
    document.title = breadcrumbs.length ? breadcrumbs.join(' < ' )+' < EMBL-EBI' : 'BioStudies < EMBL-EBI';
}

function showLoginForm() {
    $('#login-form').show();
    $('#user-field').focus();
}

function showError(error) {
    var errorTemplateSource = $('script#error-template').html();
    var errorTemplate = Handlebars.compile(errorTemplateSource);
    var data;
    //debugger
    switch (error.status) {
        case 400:
            data = {
                title: 'We’re sorry that we cannot process your request',
                message: 'There was a query syntax error in <span class="alert"><xsl:value-of select="$error-message"/></span>. Please try a different query or check our <a href="{$context-path}/help/index.html">query syntax help</a>.'
            };
            break;

        case 403:
            data = {
                title: 'We’re sorry that you don’t have access to this page or file',
                message: 'It may take up to 24 hours after submission for any new studies to become available in the database. <br/>' +
                    ' Please login if the study has not been publicly released yet.',
                forbidden:true
            };
            break;

        case 404:
            data = {
                title: 'We’re sorry that the page or file you’ve requested is not present',
                message: 'The resource may have been removed, had its name changed, or has restricted access. <br/>' +
                ' It may take up to 24 hours after submission for any new studies to become available in the database. <br/>' +
                ' Please login if the study has not been publicly released yet.'
            };
            break;
        default:
            data = {
                title: 'Oops! Something has gone wrong with BioStudies',
                message: 'The service you are trying to access is currently unavailable. We’re very sorry. Please try again later or use the feedback link to report if the problem persists.'
            };
            break;
    }

    var html = errorTemplate(data);

    $('#renderedContent').html(html);
    $('.breadcrumbs li:last #accession').html(' Error');
    updateTitleFromBreadCrumbs();
}


function formatNumber(s) {
    return new Number(s).toLocaleString();
}

function getParams() {
    var split_params = document.location.search.replace(/(^\?)/, '')
        .split("&")
        .filter(function (a) {
            return a != ''
        })
        .map(function (s) {
            s = s.split("=");
            if (s.length<2) return this;
            v = decodeURIComponent(s[1].split('+').join(' '));
            if (this[s[0]]) {
                if ($.isArray(this[s[0]])) {
                    this[s[0]].push(v)
                } else {
                    this[s[0]] = [this[s[0]], v];
                }
            } else {
                this[s[0]] = v;
            }
            return this;
        }.bind({}));
    var params = split_params.length ? split_params[0] : {};
    return params;
}

function getDateFromEpochTime(t) {
    var date = (new Date(parseInt(t))).toLocaleDateString("en-gb", { year: 'numeric', month: 'long', day: 'numeric' });
    return date == 'Invalid Date' ? (new Date()).getFullYear() : date;
}

function htmlEncode(v) {
    return $('<span/>').text(v).html();
}
