var page = require("webpage").create(),
    printer = require("printer").create(),
    system = require('system');

// Node to PhantomJS bridging required for nomnom
var process = {
    exit : function(code) {
        phantom.exit(code);
    }
};

// TODO: add proxy setting option
var opts = require("./libs/nomnom")
    .nocolors()
    .script("phantomjs decktape.js")
    .options( {
        url: {
            position: 1,
            required: true,
            help: "URL of the slides deck"
        },
        filename: {
            position: 2,
            required: true,
            help: "Filename of the output PDF file"
        },
        width: {
            default: 1280,
            help: "Width of the slides deck"
        },
        height: {
            default: 720,
            help: "Height of the slides deck"
        }
    } ).parse(system.args);

page.viewportSize = { width: opts.width, height: opts.height };
printer.paperSize = { width: opts.width + "px", height: opts.height + "px", margin: "0px" };
printer.outputFileName = opts.filename;

var currentSlide, totalSlides;

page.open(opts.url, function(status) {
    if (status !== "success") {
        console.log("Unable to load the address: " + opts.url);
        phantom.exit(1);
    } else {
        currentSlide = 1;
        totalSlides = slideCount();
        printer.begin();
        printSlide();
    }
});

function printSlide() {
    window.setTimeout(function() {
        system.stdout.write('\r' + progressBar());
        printer.printPage(page);
        if (!isLastSlide()) {
            nextSlide();
            currentSlide++;
            printSlide();
        } else {
            printer.end();
            system.stdout.write("\nPrinted " + totalSlides + " slides\n");
            phantom.exit();
        }
    }, 1000);
    // TODO: add a function per backend to wait until a particular condition instead of a timeout
}

// TODO: add progress bar, duration, ETA and file size
function progressBar() {
    var cols = [];
    cols.push("Printing slide # ");
    cols.push(leftPadding(currentSlideIndex(), totalSlides.toString().length + 2, ' '));
    cols.push(" (");
    cols.push(leftPadding(currentSlide, totalSlides.toString().length, ' '));
    cols.push('/');
    cols.push(totalSlides);
    cols.push(")...");
    return cols.join('');
}

function leftPadding(str, len, char) {
    if (typeof str === "number")
        str = str.toString();
    var l = len - str.length;
    var p = [];
    while (l-- > 0)
        p.push(char);
    return p.join('').concat(str);
}

// TODO: support backend auto-detection
// TODO: backend fallback manual support
var dzslides = require("./plugins/dzslides");

var slideCount = function() {
    return page.evaluate(dzslides.slideCount);
};

var isLastSlide = function() {
    return page.evaluate(dzslides.isLastSlide);
};

var nextSlide = function() {
    return page.evaluate(dzslides.nextSlide);
};

var currentSlideIndex = function() {
    return page.evaluate(dzslides.currentSlideIndex);
};
