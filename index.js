var split = require('event-stream').split;
var run = require('comandante');
var through = require('through');

exports = module.exports = function (since, until) {
    var data = '';
    var sp = split();
    var tr = through(write, end);
    sp.pipe(tr);
    
    var piped = false;
    sp.on('pipe', function () {
        piped = true;
    });
    
    process.nextTick(function () {
        if (!piped) history(since, until).pipe(sp);
    });
    
    var commit = null;
    
    return tr;
    
    function write (line) {
        var m;
        if (m = /^commit\s+(\S+)/i.exec(line)) {
            if (commit) {
                commit.message = commit.message.join("\n");
                this.emit('data', commit);
            }
            commit = { hash : line.split(/\s+/)[1], message: [] };
        }
        else if (m = /^Author:\s+(.+?)(?: <([^>]+)>)?$/i.exec(line)) {
            commit.author = {
                name : m[1],
                email : m[2],
            };
        }
        else if (m = /^Date:\s+(.+)/.exec(line)) {
            commit.date = new Date(m[1]);
        }
        else if (m = /^\s+(.+)/.exec(line)) {
            commit.message.push(m[1]);
        }
    }
    
    function end () {
        this.emit('data', commit);
        this.emit('end');
    }
};

function history (since, until) {
    if (since === undefined) {
        return run('git', [ 'log' ]);
    }
    else {
        return run('git', [ 'log', (since || '') + '..' + (until || '') ]);
    }
}
