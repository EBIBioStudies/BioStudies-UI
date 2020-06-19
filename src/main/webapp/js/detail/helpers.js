var Metadata = (function (_self) {

    var orgOrder = [];


    _self.registerHelpers = function() {

        Handlebars.registerHelper('find', function(key, keyval, val, obj) {
            var e = obj.filter( function(o) { return o[key]==keyval})[0];
            if (e!=undefined) return new Handlebars.SafeString(e[val]);
        });

        Handlebars.registerHelper('valueWithName', function(val, obj) {
            if (obj==null) return;
            var e = obj.filter( function(o) { return o['name']==val})[0];
            if (e==undefined) return '';
            $.each(e.valqual, function(i,v){
                if (v.name=='url') {
                    e.url = v.value;
                }
            });
            var urls = [];
            if (e.url) urls = e.url.indexOf(' | ')>=0 ? e.url.split(' | ') : [e.url];
            var html = e.value.split(' | ').map( function(v, i) {
                    return ( urls[i] ? '<a '
                            + addValQualAttributes(e.valqual)
                            + ' href="'
                            + urls[i]
                            + (urls[i][0]!='#' ? '" target="_blank':'')
                            +'">'+v+renderOntologyLinks(e.valqual)+'</a>'
                        :
                            '<span ' + addValQualAttributes(e.valqual) +'>' + v+renderOntologyLinks(e.valqual) + '</span>'
                        );
                    })
                .join(', ')
            return new Handlebars.SafeString(html);
        });

        Handlebars.registerHelper('renderLinkTableRow', function(val, obj) {
            if (obj==null) return new Handlebars.SafeString('<td></td>');
            var e = obj.filter( function(o) { return o['name']==val})[0];
            if (e==undefined) return new Handlebars.SafeString('<td></td>') ;
            e.value = e.value || '';
            var value = val.toLowerCase()=='type' && DetailPage.linkTypeMap[e.value.toLowerCase()] ? DetailPage.linkTypeMap[e.value.toLowerCase()] : e.value;
            if (val=='Section') {
                Metadata.updateSectionLinkCount(e.search);
            }
            return new Handlebars.SafeString( e.url ?
                '<td'+ ( val=='Section' && e.search ? ' data-search="'+e.search +'" ' :'') + '><a href="'
                + e.url
                + (e.url[0]!='#' ? '" target="_blank"':'"')
                + (e.title ? ' title="'+e.title+'"' : '')
                +'>'+ value+'</a></td>' : '<td>'+value+'</td>');
        });

        Handlebars.registerHelper('ifHasAttribute', function(val, obj, options) {
            var ret = false;
            if (obj!=null) {
                var e = obj.filter(function (o) {return o['name'] == val})[0];
                ret = !(e == undefined);
            }
            return ret ? options.fn(this) : options.inverse(this);

        });


        Handlebars.registerHelper('section', function(o, shouldIndent) {
            var template = Handlebars.compile($('script#section-template').html());
            this.indentClass = (shouldIndent=='true') ? 'indented-section' : '';
            return template(o);
        });

        Handlebars.registerHelper('table', function(o) {
            var template = Handlebars.compile($('script#section-table').html());
            return template(o);
        });

        Handlebars.registerHelper('ifArray', function(arr,options) {
            if(Array.isArray(arr)) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper('formatDateString', function(v) {
            var date = (new Date(v)).toLocaleDateString("en-gb", { year: 'numeric', month: 'long', day: 'numeric' });
            return date == 'Invalid Date' ? (new Date()).getFullYear() : date;
        });

        Handlebars.registerHelper('accToLink', function(val) {
            if (!val) return '';
            return accToLink(val);
        });

        Handlebars.registerHelper('ifRenderable', function(arr,options) {
            var specialSections = ['author', 'organization','organisation', 'funding', 'publication'];

            if(Array.isArray(arr) || (arr.type &&  $.inArray(arr.type.toLowerCase(),specialSections) < 0)) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper('eachGroup', function(arr, options) {
            if (!arr) return;
            var mod = arr.reduce(function(r, i) {
                r[i.name] ? r[i.name].push(i) : r[i.name]=[i];
                return r;
            }, {});
            var ret ='';
            for(var k in mod) {
                ret = ret + options.fn(mod[k]);
            }
            return ret;
        });

        Handlebars.registerHelper('setHeaders', function() {
            var names = $.map(this, function (v) {
                return $.map(v.attributes, function (v) {
                    return v.name
                })
            })
            this.headers = Array.from(new Set(names));
            this.type = this[0].type
        });

        Handlebars.registerHelper('setLinkTableHeaders', function(o) {
            if (this && this.length) {
                var names = ['Name'];
                var hsh = {'Name':1};
                $.each(this, function (i, v) {
                    v.attributes = v.attributes || [];
                    v.attributes.push({"name": "Name", "value": v.url});
                    $.each(v.attributes, function (i, v) {
                        if (!(v.name in hsh)) {
                            names.push(v.name);
                            hsh[v.name] = 1;
                        }
                    })
                });
                this.linkHeaders = names;
            }
        });

        Handlebars.registerHelper('main-file-table', function() {
            var template = Handlebars.compile($('script#main-file-table').html());
            return template(this.files);
        });

        Handlebars.registerHelper('main-link-table', function(o) {
            var o = findall(this,'links');
            var template = Handlebars.compile($('script#main-link-table').html());
            return template(o);
        });

        Handlebars.registerHelper('main-orcid-claimer', function(o,k) {
            var template = Handlebars.compile($('script#main-orcid-claimer').html());
            return template({accession:o.data.root.accno});
        });

        Handlebars.registerHelper('valquals', function(o) {
            var template = Handlebars.compile($('script#valqual-template').html());
            return template($(o).filter(function(i,q){ return q.name.toLowerCase()!='url' }).toArray());
        });


        Handlebars.registerHelper('renderOntologySubAttribute', function(arr) {
            return renderOntologyLinks(arr);
        });

        Handlebars.registerHelper('eachSubAttribute', function(arr, options) {
            if (!arr) return;
            return arr.filter( function (o) {
                return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid'])<0
            }).map( function(o, i, filtered) {
                return options.fn(o, {data: {first:i==0, last: i==(filtered.length-1), index : i}})
            }).join('')
        });

        Handlebars.registerHelper('section-link-tables', function(o) {
            var template = Handlebars.compile($('script#section-link-tables').html());
            return template(o.data.root);
        });

        Handlebars.registerHelper('link-table', function(o) {
            var names = ['Name'];
            var hsh = {'Name':1};
            $.each(o.links, function (i, v) {
                v.attributes = v.attributes || [];
                v.attributes.push({"name": "Name", "value": v.url});
                $.each(v.attributes, function (i, v) {
                    if (!(v.name in hsh)) {
                        names.push(v.name);
                        hsh[v.name] = 1;
                    }
                })
            });
            o.linkHeaders = names;
            var template = Handlebars.compile($('script#link-table').html());
            return template(o);
        });

        Handlebars.registerHelper('eachLinkTable', function(options) {
            var ret = '';
            var linkTables = findall(this,'links', false);
            var data = Handlebars.createFrame(options.data);
            $.each(linkTables, function(i,linkTable) {
                data.first = i==0, data.last = i==(linkTables.length-1), data.index = i, data.indexPlusOne = i+1;
                ret = ret + options.fn({links: $.isArray(linkTable) ? linkTable : [linkTable] },{data:data});
            });
            return ret;
        });


        Handlebars.registerHelper('asString', function() {
            console.log(this)
            return this.name
        });

        Handlebars.registerHelper('eachAuthor', function(study, options) {
            var ret = '';
            var orgs = {}

            // make an org map
            if (!study.subsections) return '';

            $.each(study.subsections.filter( function(o) { return o.type && (o.type.toLowerCase()=='organization' || o.type.toLowerCase()=='organisation') ;}), function (i,o) {
                var orgName = o.attributes ? o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'}) : [{"value":""}];
                orgs[o.accno] = orgName[0].value ;
            });


            var orgNumber = 1;
            var orgToNumberMap = {}
            var authors = study.subsections.filter( function(o) { return o.type && o.type.toLowerCase()=='author';});
            $.each(authors, function (i,o) {
                var author = {}
                $.each(o.attributes, function (i, v) {
                    if (!author[v.name]) {
                        author[v.name] = v.value;
                    } else if ($.isArray(author[v.name])) {
                        author[v.name].push(v.value);
                    } else {
                        author[v.name] = [author[v.name], v.value];
                    }
                });
                if (!author.affiliation && author.Affiliation) {
                    author.affiliation = author.Affiliation;
                }
                if (author.affiliation) {
                    if ($.isArray(author.affiliation)) {
                        var affiliations = [];
                        $(author.affiliation).each(function (i,aff) {
                            if (!orgToNumberMap[aff]) {
                                orgToNumberMap[aff] = orgNumber++;
                                orgOrder.push(aff);
                            }
                            affiliations.push({org:aff, affiliationNumber:orgToNumberMap[aff]});
                        })
                        author.affiliation = affiliations;
                    } else {
                        if (!orgToNumberMap[author.affiliation]) {
                            orgToNumberMap[author.affiliation] = orgNumber++;
                            orgOrder.push(author.affiliation);
                        }
                        author.affiliationNumber = orgToNumberMap[author.affiliation];
                    }
                }
                var data = Handlebars.createFrame(options.data);
                data.first = i==0, data.last = i==(authors.length-1), data.index = i, data.left = authors.length-10;
                ret += options.fn(author, {data: data});
            });
            return ret;
        });
        Handlebars.registerHelper('eachOrganization', function(obj, options) {
            var ret = '';
            var orgs = {};

            if (!obj.subsections) return '';

            // make an org map
            $.each(obj.subsections.filter( function(o) { return o.type && (o.type.toLowerCase()=='organization' || o.type.toLowerCase()=='organisation');}), function (i,o) {
                var orgName = o.attributes ? o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'}) : [{"value":""}];
                orgs[o.accno] = orgName[0].value ;
            });

            $.each(orgOrder, function(i,v) {
                var data = Handlebars.createFrame(options.data);
                data.first = i==0, data.last = i==(orgOrder.length-1), data.index = i, data.left = orgOrder.length-10;
                ret += options.fn({name:orgs[v],affiliationNumber:i+1, affiliation:v}, {data:data});
            });
            return ret;
        });

        Handlebars.registerHelper('eachFunder', function(obj, options) {
            var ret = '';
            var orgs = {};
            if (!obj.subsections) return '';
            // make an org map
            $.each(obj.subsections.filter( function(subsection) { return subsection.type && subsection.type.toLowerCase()=='funding';}), function (i,o) {
                var org = null, grant;
                $(o.attributes).each(function () {
                    if (this.name.toLowerCase()=='agency') org = this.value;
                    if (this.name.toLowerCase()=='grant_id') grant = this.value;
                });
                if (org) {
                    if (!orgs[org]) orgs[org] = {};
                    if (grant) {
                        if (!orgs[org].grants) orgs[org].grants= [];
                        orgs[org].grants.push({'ga':org, 'gid':grant,
                            'link': ('https://europepmc.org/grantfinder/grantdetails?query=gid:"'+grant+'" ga:"'+org+'"')
                            } );
                    }
                    orgs[org].links = o.links;
                }
            });
            var keys = Object.keys(orgs), data = Handlebars.createFrame(options.data);
            $.each(keys, function (i,v) {
                data.first = i==0, data.last = i==(keys.length-1), data.index = i;
                ret += options.fn({name:v, grants:orgs[v].grants, links:orgs[v].links },{data:data});
            });
            return ret;
        });

        Handlebars.registerHelper('renderPublication', function(obj, options) {
            var publication = {}
            if (!obj.subsections) return '';
            var pubs = obj.subsections.filter(function (o) {
                return o.type && o.type.toLowerCase() == 'publication';
            });
            if (!pubs || pubs.length < 1) return null;
            var template = Handlebars.compile($('script#publication-template').html());
            var html = '<div class="bs-name">Publication'+ (pubs.length>1 ? 's': '') +'</div>';
            $.each(pubs, function(i,pub) {
                publication.URLs = [];
                $.each(pub.attributes, function (i, v) {
                    var name = v.name.toLowerCase().replace(' ', '_');
                    var url = getURL(v.value);
                    if (url) {
                        publication.URLs.push(url);
                    } else {
                        publication[name] = v.value
                    }
                });
                publication.accno = pubs.accno;
                if (publication.accno) {
                    var url = getURL(publication.accno);
                    if (url != null) {
                        if (/^\d+$/.test(publication.accno)) {
                            publication.URLs.push(getURL('PMID' + publication.accno));
                        } else {
                            publication.URLs.push(url);
                        }
                    }
                }
                $($.map(pub.links, function (v) {
                    return v;
                })).each(function (i, link) {
                    publication.URLs.push(getURL(link.url, link.attributes.filter(function (v, i) {
                        return v.name == 'Type';
                    })[0].value));
                });

                if (!publication.URLs.length) delete publication.URLs
                html += template(publication);
            });
            return new Handlebars.SafeString(html);
        });


        Handlebars.registerHelper('makeAnchor', function makeAnchor(v) { return '#'+v} );

        Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                case 'contains':
                    return $.inArray(v2, v1)>=0 ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        });

    };


    function findall(obj,k,unroll){ // works only for files and links
        if (unroll==undefined) unroll =true
        var ret = [];
        for(var key in obj)
        {
            if (key===k) {
                if (!obj.root) {
                    var accno = obj.accno, type = obj['type'];
                    if (!accno) {
                        accno= obj.accno = 'genid'+ Metadata.getNextGeneratedId();
                    }
                    if (type=='Publication' || type=='Funding') continue;
                    $.each(obj[k], function () {
                        $.each($.isArray(this) ? this : [this], function () {
                            if (accno && type !="Study") {
                                this.attributes = this.attributes || [];
                                var targetId = accToLink(accno);
                                this.attributes.splice(0, 0, {
                                    'name': 'Section',
                                    'search': targetId,
                                    'value': type,
                                    'url': '#' + targetId,
                                    'title' : accno
                                });
                            }
                        });
                    });
                }
                $.merge(ret,obj[k]);
            } else if(typeof(obj[key]) == "object"){
                $.merge(ret,findall(obj[key],k,unroll));
            }
        }
        //unroll file tables
        if (unroll) {
            return $.map( ret, function(n){
                return n;
            });
        }
        return  ret;
    }

    function renderOntologyLinks(arr) {
        var ret = '';
        if (!arr || !arr.length) return ret;
        arr = arr.filter( function (o) {
            return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid'])>=0
        });
        $.each(arr, function (i,o) {
            if (o.name.toLowerCase()=='ontology') {
                var termname = $.grep(arr, function (o,j) { return j>i && o.name.toLowerCase()=='termname' })[0];
                var termid = $.grep(arr, function (o,j) { return j>i && o.name.toLowerCase()=='termid' })[0];
                ret += '<span data-ontology="'+ o.value+'" ' +
                    (termid ? 'data-term-id="'+ termid.value+'" ' : '') +
                    (termname ? 'data-term-name="'+ termname.value : '') +
                    '"></span>';
            }
        });
        return ret;
    }

    function addValQualAttributes(attrs) {
        var ret = '';
        if (!attrs || !attrs.length) return ret;
        $.each(attrs, function (i,o) {
            ret += 'data-'+ o.name.toLowerCase() +'="' + o.value + '"';
        });
        return ret;
    }

    return _self;
})(Metadata || {});