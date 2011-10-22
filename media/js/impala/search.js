$(function() {
    $('#search-facets').delegate('li.facet', 'click', function(e) {
        var $this = $(this);
        if ($this.hasClass('active')) {
            var $tgt = $(e.target);
            if ($tgt.is('a')) {
                $tgt.closest('.facet-group').find('.selected')
                    .removeClass('selected');
                $tgt.closest('li').addClass('selected');
                return;
            }
            $this.removeClass('active');
        } else {
            $this.closest('ul').find('.active').removeClass('active');
            $this.addClass('active');
        }
    }).delegate('.cnt', 'recount', function(e, newCount) {
        // Update # of results on sidebar.
        var $this = $(this);
        if ($this.html() != newCount.html()) {
            $this.replaceWith(newCount);
        }
    });

    if ($('body').hasClass('pjax') && $.support.pjax) {
        initSearchPjax('#pjax-results');
    }
});


function initSearchPjax(container) {
    var $container = $(container),
        timeouts = 0;

    function pjaxOpen(url) {
        var urlBase = location.pathname + location.search;
        if (!!url && url != '#' && url != urlBase) {
            $.pjax({
                url: url,
                container: container,
                timeout: 1500,
                error: function(xhr, textStatus, errorThrown) {
                    if (textStatus === 'timeout' && timeouts < 5) {
                        // Retry up to five times.
                        timeouts++;
                        return pjaxOpen(url);
                    }
                    if (textStatus !== 'abort') {
                        // Upon `error` or `parsererror`.
                        window.location = url;
                    }
                }
            });
        }
    }

    function hijackLink() {
        pjaxOpen($(this).attr('href'));
    }

    function loading() {
        var $wrapper = $container.closest('.results'),
            msg = gettext('Updating results&hellip;'),
            cls = 'updating';
        $wrapper.addClass('loading');

        // The loading throbber is absolutely positioned atop the
        // search results, so we do this to ensure a max-margin of sorts.
        if ($container.outerHeight() > 300) {
            cls += ' tall';
        }

        // Insert the loading throbber.
        $('<div>', {'class': cls, 'html': msg}).insertBefore($container);
    }

    function finished() {
        var $wrapper = $container.closest('.results');

        // Initialize install buttons and compatibility checking.
        $.when($container.find('.install:not(.triggered)')
                         .installButton()).done(function() {
            $container.find('.install').addClass('triggered');
            initListingCompat();
        });

        // Remove the loading indicator.
        $wrapper.removeClass('loading').find('.updating').remove();

        // Update the # of matching results on sidebar.
        $('#search-facets .cnt').trigger('recount', [$wrapper.find('.cnt')]);

        // Scroll up.
        $('html, body').animate({scrollTop: 0}, 200);
    }

    function turnPages(e) {
        if (fieldFocused(e)) {
            return;
        }
        if (e.which == $.ui.keyCode.LEFT || e.which == $.ui.keyCode.RIGHT) {
            e.preventDefault();
            var sel;
            if (e.which == $.ui.keyCode.LEFT) {
                sel = '.paginator .prev:not(.disabled)';
            } else {
                sel = '.paginator .next:not(.disabled)';
            }
            pjaxOpen($container.find(sel).attr('href'));
        }
    }

    $('.pjax-trigger a').live('click', _pd(hijackLink));
    $container.bind('start.pjax', loading).bind('end.pjax', finished);
    $(document).keyup(_.throttle(turnPages, 300));
}
