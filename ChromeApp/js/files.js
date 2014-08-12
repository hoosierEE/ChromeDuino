// files.js
// provides save[as] functionality

var chosenEntry = null
var saveFileButton = document.querySelector('#save_file')
var output = document.querySelector('output')
var textarea = document.querySelector('textarea')

function errorHandler(e) {
    console.error(e)
}

function displayEntryData(theEntry) {
    if (theEntry.isFile) {
        chrome.fileSystem.getDisplayPath(theEntry, function(path) {
            document.querySelector('#file_path').value = path
        })
        theEntry.getMetadata(function(data) {
            document.querySelector('#file_size').textContent = data.size
        })
    }
    else {
        document.querySelector('#file_path').value = theEntry.fullPath
        document.querySelector('#file_size').textContent = "N/A"
    }
}

function readAsText(fileEntry, callback) {
    fileEntry.file(function(file) {
        var reader = new FileReader()
        reader.onerror = errorHandler
        reader.onload = function(e) {
            callback(e.target.result)
        }
        reader.readAsText(file)
    })
}

function writeFileEntry(writableEntry, opt_blob, callback) {
    if (!writableEntry) {
        output.textContent = 'Nothing selected.'
        return
    }
    writableEntry.createWriter(function(writer) {
        writer.onerror = errorHandler
        writer.onwriteend = callback
        writer.truncate(opt_blob.size)
        waitForIO(writer, function() {
            writer.seek(0)
            writer.write(opt_blob)
        })
    }, errorHandler)
}

function waitForIO(writer, callback) {
    // set a watchdog to avoid eventual locking:
    var start = Date.now()
    // wait for a few seconds
    var reentrant = function() {
        if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
            setTimeout(reentrant, 100)
            return
        }
        if (writer.readyState===writer.WRITING) {
            console.error("Write operation taking too long, aborting!"+
                    " (current writer readyState is "+writer.readyState+")")
            writer.abort()
        }
        else {
            callback()
        }
    }
    setTimeout(reentrant, 100)
}

// for files, read the text content into the textarea
function loadFileEntry(_chosenEntry) {
    chosenEntry = _chosenEntry
    chosenEntry.file(function(file) {
        readAsText(chosenEntry, function(result) {
            textarea.value = result
        })
        // Update display.
        // allow the user to save the content
        saveFileButton.disabled = false
        displayEntryData(chosenEntry)
    })
}

// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button
function loadDirEntry(_chosenEntry) {
    chosenEntry = _chosenEntry
    if (chosenEntry.isDirectory) {
        var dirReader = chosenEntry.createReader()
        var entries = []
        // Call the reader.readEntries() until no more results are returned.
        var readEntries = function() {
            dirReader.readEntries (function(results) {
                if (!results.length) {
                    textarea.value = entries.join("\n")
                    saveFileButton.disabled = true // don't allow saving of the list
                    displayEntryData(chosenEntry)
                }
                else {
                    results.forEach(function(item) {
                        entries = entries.concat(item.fullPath)
                    })
                    readEntries()
                }
            }, errorHandler)
        }
        // Start reading dirs.
        readEntries()
    }
}

function dateTimeFilename() {
    var now = new Date()
    var t = now.toJSON().replace(/[:.-]/g, '_') // replace weird chars with underbar
    t = t.replace(/[TZ]/g, '') // strip letter codes
    t += ".csv"
    return t
}

saveFileButton.addEventListener('click', saveFileFunction)
function saveFileFunction(e) {
    var config = {type: 'saveFile', suggestedName: "ID_" + dateTimeFilename()}
    chrome.fileSystem.chooseEntry(config, writeChosenFile)

    function writeChosenFile(writableEntry) {
        var blob = new Blob([textarea.value], {type: 'text/plain'})
        writeFileEntry(writableEntry, blob, doneWriting)
    }

    function doneWriting(e) {
        output.textContent = 'Write complete :)'
    }
}

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function(data) {
    chosenEntry = null
    for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i]
        var a = (item.kind == 'file')
        var b = (item.type.match('text/*'))
        var c = (item.webkitGetAsEntry())
        if (a && b && c) {
            chosenEntry = item.webkitGetAsEntry()
            break
        }
    }

    if (!chosenEntry) {
        output.textContent = "Sorry. That's not a text file."
        return
    }
    else {
        output.textContent = ""
    }
    readAsText(chosenEntry, function(result) {
        textarea.value = result
    })
    // Update display.
    saveFileButton.disabled = false
    displayEntryData(chosenEntry)
})
