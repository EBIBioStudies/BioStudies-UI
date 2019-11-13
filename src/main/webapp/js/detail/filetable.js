var FileTable = (function (_self) {
    var selectedFiles=[];
    var selectedFilesCount=0;
    var filesTable;
    var firstRender = true;
    var columnDefinitions=[];
    var sorting=false;

    _self.render = function (acc, params, isDetailPage){
        $.ajax({url: contextPath + '/api/v1/studies/' + acc + '/info',
            data:params,
            success: function(response){
                if (isDetailPage) {
                    handleSecretKey(response.seckey);
                    handleModificationDate(response.modified);
                    if (response.isPublic) handleFTPLink(response.ftpLink);
                }
                if (!response.files || response.files==0) {
                    $('#file-list-container').parent().remove();
                    return;
                }
                handleFileTableColumns(response.columns, acc, params, isDetailPage);
                handleFileDownloadSelection(acc,params.key);
                handleFileFilters(acc, params, response.sections);
                handleAdvancedSearch(columnDefinitions);
                handleFileListButtons(acc, params.key);
            }});
    };


    _self.clearFileFilter =  function() {
        if (!filesTable) return; // not yet initialised
        filesTable.columns().visible(true);
        $(".col-advsearch-input").val('');
        filesTable.state.clear();
        filesTable.search('').columns().search('').draw();
    };

    _self.getFilesTable = function() {
        return filesTable;
    }

    _self.hideEmptyColumns= function() {
        var columnNames = filesTable.settings().init().columns
        //if($('#advsearchbtn').is(':visible')) return;
        // hide empty columns
        var hiddenColumnCount = 0;
        var thumbnailColumnIndex = -1;
        filesTable.columns().every(function(index){
            if (this[0][0]==[0] || columnNames[index].name=='Thumbnail') {
                thumbnailColumnIndex = index;
                return;
            }
            var srchd = filesTable.cells({search:'applied'},this)
                .data()
                .join('')
                .trim();
            if (this.visible() && (srchd==null || srchd=='')) {
                this.visible(false);
                hiddenColumnCount++;
            }
        });
        if (hiddenColumnCount+2===columnDefinitions.length) { // count checkbox and thumbnail column
            filesTable.column(0).visible(false);
            filesTable.column(thumbnailColumnIndex).visible(false);
        }
    };


    function handleFileListButtons(acc, key){
        var templateSource = $('script#file-list-buttons-template').html();
        var template = Handlebars.compile(templateSource);
        $('.bs-name:contains("File List")').each( function (node) {
            $(this).next().append(
                template({
                    accno:acc,
                    file:$(this).next().text().trim(),
                    keyString: key ? '?key='+key : ''
                })
            );
        });
    }

    function handleFTPLink(ftpLink) {
        $('#ftp-link').attr('href',ftpLink);
        $('#ftp-link').show();
    }

    function handleModificationDate(t) {
        if (!t) return;
        $('.release-date').append('&nbsp; ' + String.fromCharCode(0x25AA)+' &nbsp; Modified: '+ getDateFromEpochTime(t));
    }

    function handleSecretKey(key) {
        if (!key) return;
        var $secret = $('<a id="secret" href="#" class="source-icon source-icon-secret"><i class="fas fa-share-alt" aria-hidden="true"></i> Share</a>');

        $secret.bind('click', function() {
            var templateSource = $('script#secret-template').html();
            var template = Handlebars.compile(templateSource);

            $('#biostudies-secret').html(template({
                url:window.location.protocol + "//"+ window.location.host+ window.contextPath+"/studies/"+$('#accession').text()+"?key="+key
            }));
            $('#biostudies-secret').foundation('open');
            $('#copy-secret').bind('click', function(){
                var $inp = $("<input>");
                $("body").append($inp);
                $inp.val($('#secret-link').text()).select();
                document.execCommand("copy");
                $inp.remove();
                $('#secret-copied').show().delay(1000).fadeOut();

            });
        });
        $('#download-source').prepend($secret);

    }

    function handleAdvancedSearch(columnDefinitions) {
        if ($("#advanced-search").length) return;
        for (var index=0; index<columnDefinitions.length; index++) {
            var col = filesTable.column(index);
            if (!col.visible() || !columnDefinitions[index].searchable ) continue;
            var title = $(col.header()).text();
            var txtbox= $('<input style="display:none" type="text" class="col-advsearch-input col-' + title.toLowerCase() + '" placeholder="Search ' + title + '"  />')

            $(col.header()).append(txtbox);
            //$('.col-advsearch-input', this.header()).val(this.search())
        }

        $('#file-list_filter').after('<label id="advanced-search" for="advsearch"  title="Search in columns"><input style=" margin:0;width:0; height:0; opacity: 0" type="checkbox" id="advsearchinput"></input>' +
                '<i id="advanced-search-icon" class="far fa-plus-square"></i>\n' +
            '</label>');

        $("#advanced-search").click(function () {
            $('#advanced-search-icon').toggleClass('fa-plus-square').toggleClass('fa-minus-square');
            if($('#advanced-search-icon').hasClass('fa-minus-square')) {
                $(".col-advsearch-input").show();
                $('#file-list_filter input[type=search]').val('').prop('disabled','disabled');
                //debugger;
            } else {
                $(".col-advsearch-input").hide();
                $('#file-list_filter input[type=search]').removeAttr('disabled');
            }
            $(".col-size").prop('disabled', true);

            filesTable.columns(8).search('11').draw();
        });

    }

    function handleFileTableColumns(columns, acc, params, isDetailPage) {

        if (!isDetailPage) {
            $('#file-list').addClass('bigtable');
        }
        columns.splice(0, 0, {
            name: "x",
            title: "",
            searchable: false,
            type:"string",
            visible: true,
            orderable: false,
            render: function (data, type, row) {
                return '<div class="file-check-box"><input type="checkbox" data-name="' + row.path + '"></input></div>';;
            }
        });
        // add section rendering
        var sectionColumn = columns.filter(function(c) {return c.name=='Section';});
        if (sectionColumn.length) {
            sectionColumn[0].render = function (data, type, row) {
                return data && data!='' ?
                    '<a href="#'+data+'">'+$('#'+data+' .section-name').first().text().trim()+'</a>'
                    : '';
            }
        }
        sectionColumn = columns.filter(function(c) {
            return c.title=='Thumbnail';
        });
        if (sectionColumn.length) {
            sectionColumn[0].render = function (data, type, row) {
            return '<img  height="100" width="100" src="'
                + window.contextPath + '/thumbnail/' + $('#accession').text() + '/' + row.path + (params.key? '?key='+params.key :'')+'" </img> ';
            }
        }
        filesTable = $('#file-list').DataTable({
            lengthMenu: [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
            processing: true,
            serverSide: true,
            columns: columns,
            scrollX: !isDetailPage,
            order: [[ 1, "asc" ]],
            language:
                {
                    processing: '<i class="fa fa-3x fa-spinner fa-pulse"></i>',
                },
            columnDefs: [
                {
                    orderable: false,
                    className: 'select-checkbox',
                    targets: 0
                },
                {
                    targets: 2,
                    render: function (data, type, row) {
                        return getByteString(data);
                    }
                },
                {
                    targets: 1,
                    render: function (data, type, row) {
                        return '<a class="overflow-name-column' + (data.indexOf('.sdrf.txt')>0 ? ' sdrf-file'  : '')+ ' target="_blank" style="max-width: 500px;" title="'
                            + data
                            + '" href="'
                            + window.contextPath+'/files/'+acc+'/' +encodeURI(row.path).replaceAll('#','%23').replaceAll("+", "%2B").replaceAll("=", "%3D").replaceAll("@", "%40").replaceAll("$", "%24")
                            + (params.key ? '?key='+params.key : '')
                            + '">'
                            + data + '</a>';
                    }
                }
            ],
            ajax: {
                url: contextPath + '/api/v1/files/'+ acc,
                type: 'post',
                data: function (dtData) {
                    // add file search filter
                    if (firstRender && params['fs']) {
                        $('#all-files-expander').click();
                        dtData.search.value = params.fs;
                    }

                    return $.extend(dtData, params)
                },
                complete: function (data) {
                    if (firstRender && params.fs) {
                        firstRender = false;
                        $('#file-list_filter input[type=search]').val(params.fs)
                    }
                }
            },
            rowCallback: function( row, data ) {
                if ( $.inArray(data.path, selectedFiles) !== -1 ) {
                    $(row).addClass('selected');
                }
            },
            "infoCallback": function( settings, start, end, max, total, out ) {
                btn = $('<span/>').html ('<a class="section-button" id="clear-file-filter"><span class="fa-layers fa-fw">'
                    +'<i class="fas fa-filter"></i>'
                    +'<span class="fa-layers-text" data-fa-transform="shrink-2 down-4 right-6">×</span>'
                    +'</span> show all files');
                return (total== max) ? out : out + btn.html();
            }
        }).on('preDraw', function (e) {
            filesTable.columns().visible(true);
        }).on('draw.dt', function (e) {
            handleDataTableDraw(selectedFiles, updateSelectedFiles, handleThumbnails, params, filesTable);
        }).on( 'search.dt', function (e) {
        }).on( 'order.dt', function () {sorting=true;});
        columnDefinitions = columns;

    }

    function handleDataTableDraw(selectedFiles, updateSelectedFiles, handleThumbnails, params, filesTable) {
        $('.file-check-box input').on('click', function () {
            if ($(this).is(':checked')) {
                selectedFiles.push($(this).data('name'));
            } else {
                selectedFiles.splice($.inArray($(this).data('name'), selectedFiles), 1);
            }
            $(this).parent().parent().parent().toggleClass('selected');
            updateSelectedFiles();
        });

        $('.file-check-box input').each(function () {
            if ($.inArray($(this).data('name'), selectedFiles) >= 0) {
                $(this).attr('checked', 'checked');
            }
        });

        $('#clear-file-filter').on('click', function () {
            FileTable.clearFileFilter();
        });


        // TODO: enable select on tr click
        updateSelectedFiles();
        handleThumbnails(params.key);




        if ($('#advanced-search-icon').hasClass('fa-minus-square')) {
            $(".col-advsearch-input").show();
        }
        $('.col-advsearch-input').click(function (e) {
            e.preventDefault();
            return false;
        });
        $('.col-advsearch-input').bind('keydown', function (e) {
            if (e.keyCode == 13) {
                filesTable.columns().every(function (index) {
                    var q = $('.col-advsearch-input', this.header()).val();
                    if (this.search() !== q && this.visible()) {
                        this.search(q);
                    }
                });
            }
        });
        if(!sorting) {
            hideEmptyColumns();
        }else {
            sorting=false;
        }
    }


    function handleFileFilters(acc,params, sections) {
        // add file filter button for section
        $(sections).each(function (i,divId) {
            var bar = $('#' + divId + '> .bs-name > .section-title-bar');
            bar.append('<a class="section-button" data-files-id="'+ divId + '"><i class="fa fa-filter"></i> show files in this section</a>');
            var listFile = $('section#'+this).data('filelist');
        });
        // handle clicks on file filters in section
        $("a.section-button[data-files-id]").click(function () {
            var expansionSource = '' + $(this).data('files-id');
            Metadata.setExpansionSource(expansionSource);
            //clearFileFilter();
            $('#all-files-expander').click();
            filesTable.column(':contains(Section)').search(expansionSource);
            filesTable.draw();

        });
    }

    function handleFileDownloadSelection(acc,key) {

        // add select all checkboz
        $(filesTable.columns(0).header()).html('<input id="select-all-files"  type="checkbox"/>');
        $('#select-all-files').on('click', function () {
            $('body').css('cursor', 'progress');
            $('#select-all-files').css('cursor', 'progress');
            $('#file-list_wrapper').css('pointer-events','none');
            if ($(this).is(':checked')) {
                $('.select-checkbox').parent().addClass('selected');
                $('.select-checkbox input').prop('checked',true);
                $.post(contextPath+ '/api/v1/files/'+ acc, $.extend(true, {}, filesTable.ajax.params(), {
                        length: -1,
                        metadata: false,
                        start: 0
                    }),
                    function (response) {
                        var filtered = [];
                        for (var i=0; i< response.data.length; i++) {
                            filtered.push(response.data[i].path);
                        }
                        selectedFiles = $.uniqueSort($.merge(selectedFiles, filtered ));
                        updateSelectedFiles();
                    }
                );
            } else {
                selectedFiles=[];
                $('.select-checkbox').parent().removeClass('selected');
                $('.select-checkbox input').prop('checked',false);
                $('#file-list_wrapper').css('pointer-events','auto');
                updateSelectedFiles();
            }
        });

        $("#download-selected-files").on('click', function () {
            // select all checked input boxes and get the href in the links contained in their siblings
            var html = '<form method="POST" target="_blank" action="'
                + window.contextPath + "/files/"
                + $('#accession').text() + '/zip">';
            $(selectedFiles).each( function(i,v) {
                html += '<input type="hidden" name="files" value="'+v+'"/>'
            });
            if (key) {
                html += '<input type="hidden" name="key" value="'+key+'"/>' ;
            }
            html += '</form>';
            var submissionForm = $(html);
            $('body').append(submissionForm);
            $(submissionForm).submit();
        });

    }

    function updateSelectedFiles() {
        if (selectedFiles.length>0) {
            $('.filetoolbar #selected-file-count').html(selectedFiles.length);
            $('.filetoolbar').css('visibility', 'visible');
        } else {
            $('.filetoolbar').css('visibility', 'hidden');
        }

        $('#select-all-files').prop('checked', $('.select-checkbox input:checked').length == $('.select-checkbox input').length );
        $('body').css('cursor', 'default');
        $('#select-all-files').css('cursor', 'default');
        $('#file-list_wrapper').css('pointer-events','auto');
    }

    function handleThumbnails(key) {
        var imgFormats = ['bmp','jpg','wbmp','jpeg','png','gif','tif','tiff','pdf','docx','txt','csv','html','htm'];
        var isZip = false;
        if(filesTable.column('Thumbnail')) {
            isZip = true;
        }
        if(isZip)
            imgFormats.splice(1,0,'zip');
        $(filesTable.column(1).nodes()).each(function () {
            var path = encodeURI($('input',$(this).prev()).data('name')).replaceAll('#','%23');
            $('a',this).addClass('overflow-name-column');
            $('a',this).attr('title',$(this).text());
            if ( $.inArray(path.toLowerCase().substring(path.lastIndexOf('.')+1),
                imgFormats) >=0 ) {
                $(this).append('<a href="'+$(this).find('a').attr('href')+'" class="thumbnail-icon" data-thumbnail="'
                    +window.contextPath+'/thumbnail/'+ $('#accession').text()+'/'+path+'"><i class="far fa-file-image"></i></a>')
            }
        });

        $(filesTable.column(1).nodes()).hover( function() {
            var $tn = $(this).find('.thumbnail-icon');
            if (!$tn.length) return;
            $('#thumbnail').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="sr-only">Loading...</span>')
            $('#thumbnail').css('top',$tn.offset().top - 10);
            $('#thumbnail').css('left',$tn.parent().offset().left - $('#thumbnail').width() - 10);
            $('#thumbnail').show();
            var img = $("<img />").attr('src', $tn.data('thumbnail')+(key ? '?key='+key :''))
                .on('load', function() {
                    if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                        $('#thumbnail').hide();
                    } else {
                        $('#thumbnail').html('').append(img)
                        $('#thumbnail').css('top',$tn.offset().top - 10);
                        $('#thumbnail').css('left',$tn.parent().offset().left - $('#thumbnail').width() - 10);
                        $('#thumbnail').show();
                    }
                });
        }, function () {
            $('#thumbnail').hide();
        });

    }

    function getByteString(b) {
        if (b==undefined) return '';
        if (b==0) return '0 bytes';
        if (b==1) return '1 byte';
        prec = {'bytes':0, 'KB':0, 'MB':1, 'GB':2, 'TB':2, 'PB':2, 'EB':2, 'ZB':2, 'YB':2};
        keys = $.map(prec, function(v,i){return i});
        var i = Math.floor(Math.log(b) / Math.log(1000))
        return parseFloat(b / Math.pow(1000, i)).toFixed(prec[keys[i]]) + ' ' + keys[i];
    }


    return _self;

})(FileTable || {});