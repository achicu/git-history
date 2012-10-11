var es = require('event-stream');

exports = module.exports = function () {
    return es.pipeline(es.split(), es.through(write, end));

    var commit = null;

    function pushCommit(stream) {
        if (commit) {
            commit.message = commit.message.join("\n");
            stream.emit('data', commit);
        }
    }
        
    function write (line) {
        var m;
        if (m = /^commit\s+(\S+)/i.exec(line)) {
            pushCommit(this);
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
        pushCommit(this);
        this.emit('end');
    }
};