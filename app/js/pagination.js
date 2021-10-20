/* Pagination plugins integrated with Laravel's pagination response. Jaydeep Mor */
/* This will append HTML pagination buttons. */

const DIPLAY_PAGES = 3;

function paginate(data, appendElement, callback, args)
{
    emptyPaginationHtml(appendElement);

    if (!empty(data) && Object.keys(data).length > 0) {
        let currentPage = data.current_page || 1,
            perPage     = data.per_page,
            total       = data.total,
            totalPage   = Math.ceil(total / perPage) || 1,
            buttonHtml  = '',
            path        = data.path || '#',
            href        = path + '?page_number=' + (currentPage - 1);

        if (currentPage > 1) {
            buttonHtml += getPreviousButtonHtml((currentPage - 1), href);

            for (page = 1; page < currentPage; page++) {
                let href = path + '?page_number=' + page;

                buttonHtml += getButtonHtml(page, href, false);
            }
        }

        let inc = 1;

        for (page = currentPage; page <= totalPage; page++) {
            let selected = (currentPage == page);

            if (inc <= DIPLAY_PAGES) {
                let href = path + '?page_number=' + page;

                buttonHtml += getButtonHtml(page, href, selected);

                inc++;
            } else if (currentPage <= totalPage) {
                let href = path + '?page_number=' + (currentPage + 1);

                buttonHtml += getNextButtonHtml((currentPage + 1), href);

                break;
            } else {
                break;
            }
        }

        appendToElement(buttonHtml, appendElement);

        if (!empty(buttonHtml)) {
            initEventBindings(appendElement, currentPage, callback, args);
        }
    }
}

function getButtonHtml(pageNumber, href, selected)
{
    return '<button class="btn btn-default btn-rounded full-rounded" data-page-number="' + pageNumber + '">' + 
                '<a href="#" data-href="' + href + '" class="' + (selected ? " selected" : "") + '">' + 
                    pageNumber + 
                '</a>' + 
            '</button>&nbsp;';
}

function getNextButtonHtml(pageNumber, href)
{
    return '<button class="btn btn-primary btn-rounded full-rounded next-page" data-page-number="' + pageNumber + '">' + 
                '<a href="#" data-href="' + href + '">' + 
                    '>' + 
                '</a>' + 
            '</button>&nbsp;';
}

function getPreviousButtonHtml(pageNumber, href)
{
    return '<button class="btn btn-primary btn-rounded full-rounded previous-page" data-page-number="' + pageNumber + '">' + 
                '<a href="#" data-href="' + href + '">' + 
                    '<' + 
                '</a>' + 
            '</button>&nbsp;';
}

function appendToElement(buttonHtml, appendElement)
{
    emptyPaginationHtml(appendElement);

    if (!empty(appendElement) && appendElement.length > 0 && !empty(buttonHtml)) {
        appendElement.empty().html(buttonHtml);
    }
}

function emptyPaginationHtml(appendElement)
{
    appendElement.empty();
}

function initEventBindings(appendElement, currentPage, callback, args)
{
    appendElement.find('button').on("click", function() {
        let self       = $(this),
            pageNumber = self.data('page-number');

        if (currentPage != pageNumber) {
            args.push(pageNumber);

            callback.apply(this, args);
        }
    });

    $(document).find('#next-page').on("click", function() {
        let self       = $(this),
            pageNumber = self.data('page-number');

        self.data('page-number', (pageNumber + 1));

        appendElement.find('button').click();
    });

    $(document).find('#previous-page').on("click", function() {
        let self       = $(this),
            pageNumber = self.data('page-number');

        self.data('page-number', (pageNumber - 1));

        appendElement.find('button').click();
    });
}
