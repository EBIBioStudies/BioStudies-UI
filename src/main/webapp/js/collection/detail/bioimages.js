const acc = $('#accession').text().trim();
const url = `https://uk1s3.embassy.ebi.ac.uk/bia-integrator-data/${acc}/${acc}-representative-512-512.png`
$.ajax({
    url: url,
    type: 'HEAD',
    success: function (data) {
        const img = $(`<span><a href="#" title="Click here to view thumbnails"><img src="${url}" style="max-width: 100px;"></a></span><span style="padding: 10px;">`)
        $('#orcid-title').prepend(img)
        $('#orcid-title span').css('display:table-cell; vertical-align:middle;')
    }});

