function FancyJSON(runner) {

	var result = {
        tests: [],
        duration: 0,
        passed: 0,
        failed: 0
    };

    function suiteTitle(suite) {
        if (!suite || suite.title === '') {
            return '';
        }

        return suiteTitle(suite.parent) + ' -> ' + suite.title + '';
    }

    function appendTest(test, testResult) {
        var duration = test.duration / 1000;
        result.tests.push({
            name: suiteTitle(test.parent) + '\n\t\t' + test.title,
            result: testResult,
            message: test.state,
            duration: duration
        });

        result.duration += duration
    }

    runner.on('pass', function(test){
        appendTest(test, true);
        result.passed++;
    });

    runner.on('fail', function(test, err){
        appendTest(test, false);
        result.failed++;
    });

	runner.on('end', function() {
        result.total = result.failed + result.passed;
		window.jsonReport = result;
	});
}


function mochaSaucePlease(options, fn) {

	(function(runner) {

		// execute optional callback to give user access to the runner
		if(fn) {
			fn(runner);
		}

		if(!options) {
			options = {};
		}

		// in a PhantomJS environment, things are different
		if(!runner.on) {
			return;
		}

		// Generate JSON coverage
		mocha.reporter(FancyJSON);
		new mocha._reporter(runner);

		// Generate XUnit coverage
		window.xUnitReport = 'off';
		if(options.xunit != false) {
			window.xUnitReport = '';
			(function() {
				var log = window.console && console.log;

				if(!window.console) {
					window.console = {};
				}

				console.log = function() {
					window.xUnitReport += arguments[0] + "\n"; // TODO: handle complex console.log
					if(log) log.apply(console, arguments);
				};
			})();
			mocha.reporter("xunit", {});
			new mocha._reporter(runner);
		}

		// The Grid view needs more info about failures
		var failed = [];
		runner.on('fail', function(test, err) {
			failed.push({
				title: test.title,
				fullTitle: test.fullTitle(),
				error: {
					message: err.message,
					stack: err.stack
				}
			});
		});

		// implement custom reporter for console to read back from Sauce
		runner.on('end', function() {
			runner.stats.failed = failed;
			runner.stats.xUnitReport = xUnitReport;
			runner.stats.jsonReport = jsonReport;
			window.mochaResults = runner.stats;
			window.chocoReady = true;
		});

	})(window.mochaPhantomJS ? mochaPhantomJS.run() : mocha.run());

}