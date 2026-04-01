(function () {
    var $body = document.querySelector('body'),
        $searchResults,
        $searchInputs,
        $searchList,
        $searchTitle,
        $searchResultsCount,
        $searchQuery,
        $mainContainer,
        $xsMenu,
        pagefind = null;

    function throttle(fn, wait) {
        var timeout;
        return function () {
            var ctx = this,
                args = arguments;
            if (!timeout) {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    fn.apply(ctx, args);
                }, wait);
            }
        };
    }

    function displayResults(query, results) {
        var noResults = results.length === 0;
        if (noResults) {
            $searchResults.classList.add('no-results');
        } else {
            $searchResults.classList.remove('no-results');
        }

        $searchList.innerText = '';
        $searchResultsCount.innerText = results.length;
        $searchQuery.innerText = query;

        // Group results by context (extracted from title)
        var groups = {};
        results.forEach(function (res) {
            var parts = res.title.split(' - ');
            var context = parts[0] || 'other';
            if (!groups[context]) {
                groups[context] = [];
            }
            groups[context].push(res);
        });

        var sortedGroups = Object.keys(groups).sort();
        for (var i = 0; i < sortedGroups.length; i++) {
            var group = sortedGroups[i];
            var $li = document.createElement('li');
            $li.classList.add('search-results-group');

            var $groupTitle = document.createElement('h3');
            $groupTitle.innerText =
                group.charAt(0).toUpperCase() + group.substring(1) +
                ' (' + groups[group].length + ')';
            $li.appendChild($groupTitle);

            var $ulResults = document.createElement('ul');
            $ulResults.classList.add('search-results-list');

            groups[group].forEach(function (res) {
                var $liResult = document.createElement('li');
                $liResult.classList.add('search-results-item');

                var $link = document.createElement('a');
                $link.innerText = res.title.split(' - ').slice(1).join(' - ') || res.title;
                $link.href = res.url;
                $liResult.appendChild($link);
                $ulResults.appendChild($liResult);
            });

            $li.appendChild($ulResults);
            $searchList.appendChild($li);
        }
    }

    async function launchSearch(q) {
        $body.classList.add('with-search');

        if ($xsMenu && $xsMenu.style.display === 'block') {
            $mainContainer.style.height = 'calc(100% - 100px)';
            $mainContainer.style.marginTop = '100px';
        }

        if (!pagefind) {
            try {
                var prefix = '';
                switch (COMPODOC_CURRENT_PAGE_DEPTH) {
                    case 5: prefix = '../../../../../'; break;
                    case 4: prefix = '../../../../'; break;
                    case 3: prefix = '../../../'; break;
                    case 2: prefix = '../../'; break;
                    case 1: prefix = '../'; break;
                    default: prefix = './'; break;
                }
                pagefind = await import(prefix + 'pagefind/pagefind.js');
                await pagefind.init();
            } catch (e) {
                console.error('Pagefind init failed:', e);
                return;
            }
        }

        var search = await pagefind.search(q);
        var maxResults = typeof MAX_SEARCH_RESULTS !== 'undefined' ? MAX_SEARCH_RESULTS : 15;
        var sliced = search.results.slice(0, maxResults);

        var results = await Promise.all(
            sliced.map(function (r) { return r.data(); })
        );

        var mapped = results.map(function (data) {
            return {
                title: data.meta.title || '',
                url: data.url,
                excerpt: data.excerpt
            };
        });

        displayResults(q, mapped);
    }

    function closeSearch() {
        $body.classList.remove('with-search');
        if ($xsMenu && $xsMenu.style.display === 'block') {
            $mainContainer.style.height = 'calc(100% - 50px)';
        }
    }

    function bindSearch() {
        $searchInputs = document.querySelectorAll('#book-search-input input');
        $searchResults = document.querySelector('.search-results');
        $searchList = $searchResults.querySelector('.search-results-list');
        $searchTitle = $searchResults.querySelector('.search-results-title');
        $searchResultsCount = $searchTitle.querySelector('.search-results-count');
        $searchQuery = $searchTitle.querySelector('.search-query');
        $mainContainer = document.querySelector('.container-fluid');
        $xsMenu = document.querySelector('.xs-menu');

        $searchInputs.forEach(function (item) {
            item.addEventListener('input', function () {
                var q = this.value;
                if (q.length === 0) {
                    closeSearch();
                } else {
                    launchSearch(q);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindSearch();

        // Check for search query in URL
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q) {
            $searchInputs.forEach(function (item) { item.value = q; });
            launchSearch(q);
        }
    });
})();
