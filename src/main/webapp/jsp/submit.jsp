<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib uri="http://jawr.net/tags" prefix="jwr" %>

<c:set var="contextPath" value="${pageContext.request.contextPath}"/> <t:generic>
    <jsp:attribute name="head">
        <jwr:script src="/js/common.min.js"/>
        <style>
            .home-icon:before {
                color: #FFFFFF !important;
                font-size: 22pt !important;
                vertical-align: middle;
                border: 1px solid #22AAE2;
                border-radius: 50%;
                background: #0378BB;
                padding: 14px;
                margin-right: 0px !important;
                vertical-align: initial;
                box-shadow: inset 0 0 0 2px white;
            }

            .home-icon {
                color: #0378BB !important;
            }


            #static-text h5 {
                color: #267799;
            }

            #static-text .submitlnk {
                border-width: 0;
                text-align: center;
                margin: 30pt 0;
            }
        </style>
    </jsp:attribute>

    <jsp:attribute name="breadcrumbs">
        <ul class="breadcrumbs">
            <li><a href="${contextPath}/">BioStudies</a></li>
            <li>
                <span class="show-for-sr">Current: </span> Submit
            </li>
        </ul>
    </jsp:attribute>
    <jsp:body>
        <div id="static-text">
            <div class="submitlnk">
                <h2>
                    <a href="submissions" title="Browse BioStudies"> <span class="icon icon-functional home-icon"
                                                                           data-icon="D"> Submit a Study</span> </a>
                </h2>
            </div>

            <h5><i class="fa-solid fa-circle-question"></i> What can be submitted to BioStudies?</h5>
            <p class="justify">We welcome submissions of all biological data that do not fit in the other, specialised
                EBI resources, as well as data packages that link together datasets in other resources (e.g.,
                multi-omics). Usually a dataset is associated with a preprint or a publication. </p>
            <p class="justify">
                Please use our data deposition tools, or contact us to discuss establishing a data pipeline in case of
                potential large submission volumes, e.g. as generated by an ongoing project.</p>

            <div class="callout warning">Please note - All gene expression and other functional genomics data should be
                submitted to the <a href="https://www.ebi.ac.uk/biostudies/arrayexpress">ArrayExpress collection</a>
                using <a href="https://www.ebi.ac.uk/fg/annotare/">Annotare</a>.
            </div>
            </p>

            <h5><i class="fa-solid fa-circle-question"></i> How do I submit?</h5>
            <p class="justify">
                Submissions are handled via our online submission tool. There are two main steps - uploading the data
                files, and providing metadata descriptions such as contact details, links to related datasets in other
                resources etc. Several data upload methods are supported - via the submission tool, as well as using FTP
                and Aspera protocols. Metadata can be provided by filling in a web form. Data in BioStudies is organised
                into collections, and different collections will have different forms. A tab-delimited format described
                <a href="https://www.ebi.ac.uk/biostudies/misc/SubmissionFormatV5a.pdf">here</a> is an alternative
                submission method. If you feel that the tool does not fit your requirements please contact us at <a
                    href="mailto:biostudies@ebi.ac.uk">biostudies@ebi.ac.uk</a>. </p>

            <h5><i class="fa-solid fa-circle-question"></i> Is there a cost to deposit data in BioStudies?</h5>
            <p class="justify">No, both deposition of data to BioStudies and data access are free of charge.</p>

            <h5><i class="fa-solid fa-circle-question"></i> What is the best way to submit large volumes of information?
            </h5>
            <p class="justify">We recommend Aspera transfer for medium to large (10 GiB+) volumes of data.</p>

            <h5><i class="fa-solid fa-circle-question"></i> How and when do I receive a BioStudies accession number?
            </h5>
            <p class="justify">Accession numbers are assigned during the submission process. The system needs to
                validate and transfer data files before issuing an accession number. For small datasets this can take
                just minutes, while larger data volumes (hundreds of GiB) may take hours. Note that usually the
                bottleneck will be the initial transfer of data files into your BioStudies “home” area, prior to filling
                in the metadata form.</p>

            <h5><i class="fa-solid fa-circle-question"></i> Do you assign Digital Object Identifiers (DOIs)?</h5>
            <p class="justify">Yes, they are automatically assigned after submission.</p>

            <h5><i class="fa-solid fa-circle-question"></i> How are names handled for DOIs?</h5>
            <p class="justify">BioStudies DOIs are assigned by <a href="https://www.crossref.org/">Crossref</a>. We
                populate the Crossref
                <a href="https://www.crossref.org/documentation/schema-library/required-recommended-elements/"> metadata
                 schema</a>, where the "Surname" field is required if a dataset Contributor is specified, and
                "given_name" is optional. User names in the BioStudies system are registered as single strings. For
                Crossref, we split the string at the first space, treating everything after it as the surname. If there
                are no spaces in the user name, then the user name will be used as "Surname" and "given_name" will be
                left blank. Please <a href="mailto:biostudies@ebi.ac.uk">Contact us</a> if this approach results in an
                unsatisfactory Crossref DOI record.</p>

            <h5><i class="fa-solid fa-circle-question"></i> Can I keep my dataset private (e.g. until publication)?</h5>
            <p class="justify">Yes. When you submit your data, you can choose a release date. Until that date, your data
                will not be publicly visible. You can choose to share your data with specific people (e.g. editors of
                the associated manuscript) by clicking the Share button in the data access page and forwarding the URL
                that is presented.</p>

            <h5><i class="fa-solid fa-circle-question"></i> Can I add a publication or perform other edits to my dataset
                at a later point?</h5>
            <p class="justify">Yes, you can edit the publication field of your dataset’s. While a dataset remains
                private, you can perform arbitrary edits, e.g., add more data, change the release date, change metadata.
                After a dataset has become public, some operations are restricted, e.g., making it private again, or
                deleting data files.</p>

            <h5><i class="fa-solid fa-circle-question"></i> Under what license(s) is a BioStudies dataset available?
            </h5>
            <p class="justify">New datasets in BioStudies are released into the public domain under the terms of a <a
                    href="https://creativecommons.org/publicdomain/zero/1.0/legalcode">Creative Commons Zero (CC0)
                waiver</a>.</p>

            <h5><i class="fa-solid fa-circle-question"></i> How are ORCIDs used in BioStudies?</h5>
            <p class="justify">Data depositors can include their ORCIDs in contact details; these will be searchable in
                the data access interface. If you are an author of a dataset, you can also claim it through the browse
                interface.</p>

            <h5><i class="fa-solid fa-circle-question"></i> Which file types can I submit?</h5>
            <div class="justify">BioStudies accepts all file types. However, there are some restrictions in the naming of
                the files. It is safe to use: <br/>
            <ul>
                <li>Any alphanumeric character (a-z | A-Z | 0-9)</li>
                <li>Any of the following special characters
                    <ul style="list-style-type: circle">
                        <li>Exclamation point ( ! )</li>
                        <li>Hyphen ( - )</li>
                        <li>Underscore ( _ )</li>
                        <li>Period ( . )</li>
                        <li>Asterisk ( * )</li>
                        <li>Single quote ( ' )</li>
                        <li>Open parenthesis ( ( )</li>
                        <li>Close parenthesis ( ) )</li>
                    </ul>
                </li>
            </ul>
            These follow the <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html">Amazon S3
            object key naming guidelines</a>. For submissions via the PageTab files, and in file lists:<br/>
            <ul>
                <li>when referring to a directory the file path must not end with a slash (it should be e.g.
                    “/mysubmission/mysubdirectory”)
                </li>
                <li>please avoid trailing spaces (space character at the end of a file name)</li>
            </ul>
            </div>


            <div class="submitlnk">
                <h2>
                    <a href="submissions" title="Browse BioStudies"> <span class="icon icon-functional home-icon"
                                                                           data-icon="D"> Submit a Study</span> </a>
                </h2>
            </div>
        </div>
    </jsp:body>
</t:generic>

