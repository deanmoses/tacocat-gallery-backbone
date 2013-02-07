// This follows the AMD module format, so that curl.js can load it
define(function() {

    var fn = {

        quickFind: function(params) {

            /*
                @param input (DOM object)
                @param list (DOM object)
                @param listSelector (string)
                @param searchSelector (string)
            */

            var
                $input = $(params.input),
                $list = $(params.list)
            ;

            $input.on('keyup', function(e) {

                $list.find(params.listSelector).each(function(index, el) {

                    var
                        $element = $(el),
                        value = $element.first(params.searchSelector).text(),
                        re = new RegExp($input.val(), 'gi')
                    ;

                    if( value.match(re) ) {

                        $element.removeClass('hidden');

                    } else {

                        $element.addClass('hidden');

                    }

                });

            });

        }

    };

    return fn;

});