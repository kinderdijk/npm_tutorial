var mathjax = require('mathjax-node');

module.exports = {
    
    config: function() {
        mathjax.config({
            displayMessages: false, // determines whether Message.Set() calls are logged
            displayErrors:   true, // determines whether error messages are shown on the console
            undefinedCharError: false, // determines whether "unknown characters" (i.e., no glyph in the configured fonts) are saved in the error array
            extensions: '', // a convenience option to add MathJax extensions
            fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
            MathJax: {}
        });
    },
    
    writeEquation: function(equation, done) {
        mathjax.start();
    
        mathjax.typeset({
            math: equation,
            format: "TeX", // "inline-TeX", "MathML"
            mml:true, //  svg:true,
        }, function (data) {
            if (!data.errors) {
                done(null, data);
            } else {
                done(data.errors, null);
            }
            
        });
    }
}