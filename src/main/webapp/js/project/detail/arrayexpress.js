// create links for sample number
$(Metadata.sectionTables).each(function () {
    //debugger
    var sampleColumn =  this.columns(function(i,d,n){ return $(n).text()=='No. of Samples' });
    if (!sampleColumn || !sampleColumn.length ||!sampleColumn.nodes()[0] ||  !sampleColumn.nodes()[0].length) return;
    $(sampleColumn.nodes()[0]).each( function(i,v) {
        if($('a',this).length==1) return;
        var id = generatedID++;
        $(v).wrapInner('<a id="genid' +  id  + '" name="genid'+ id +'" href="#"></a>');
        $('a',v).attr('data-file-data-search',$(v).siblings().map(function(){ return $(this).text(); }).toArray().join(' '));
    })

});
$('a[data-file-data-search]').click( function () {
    expansionSource = ''+$(this).attr('id');
    clearFileFilter();
    $('#all-files-expander').click();
    filesTable.search($(this).data('file-data-search'));
    // hide empty columns
    filesTable.columns().every(function(){ if (filesTable.cells({search:'applied'},this).data().join('').trim()=='') this.visible(false) });
    filesTable.draw();
    return false;
})

// format MIAME/MinSeq scores
var $miameTitleDiv = $('.bs-name:contains("MIAME Score")');
if ($miameTitleDiv.text().trim().toLowerCase()=='miame score') {
    $miameTitleDiv.next().removeClass('has-child-section').css({'column-count':'5', 'width':'33%'});
    $('.bs-name',$miameTitleDiv.next()).toggleClass('bs-name miame-score-title');
    $('.miame-score-title').css('text-align','center').next().css('text-align','center').each(function() {
        $(this).html($(this).text().trim()=='*' ? '<i class="fas fa-asterisk" data-fa-transform="shrink-8"></i>' : '<i class="fas fa-minus" data-fa-transform="shrink-8"></i>' )
    })
}
var $minseqTitleDiv = $('.bs-name:contains("MINSEQE Score")');
if ($minseqTitleDiv.text().trim().toLowerCase()=='minseqe score') {
    $minseqTitleDiv.next().removeClass('has-child-section').css({'column-count':'5', 'width':'42%'});
    $('.bs-name',$minseqTitleDiv.next()).toggleClass('bs-name minseq-score-title');
    $('.minseq-score-title').css('text-align','center').next().css('text-align','center').each(function() {
        $(this).html($(this).text().trim()=='*' ? '<i class="fas fa-asterisk" data-fa-transform="shrink-8"></i>' : '<i class="fas fa-minus" data-fa-transform="shrink-8"></i>' )
    })
}


// add icon for files
var newIcon = $('<span class="fa-icon" title="Click to expand"><i class="fa fa-external-link-alt"></i></span>')
    .css({'float':'right', 'padding-left': '3px', 'cursor': 'pointer'})
    .click(function() {
        window.open( contextPath + (project? '/'+project:'')+'/studies/'+ $('#accession').text() + '/files' );
    });
$('#all-files-expander').before(newIcon);

// add icon for sdrf
var sdrfIcon = $('<a  href="#" class="fa-icon source-icon source-icon-json" title="Click to open SDRF Viewer"><i class="fas fa-table"></i> View SDRF</a>')
    .css({'background-color': '#267799'})
    .click(function() {
        window.open( contextPath + (project? '/'+project:'')+'/studies/'+ $('#accession').text() + '/sdrf?file='+$('.sdrf-file').attr('href') );
    });
$('#download-source').prepend(sdrfIcon);