// _________ VARIABLES _________
// var title, author, rating, shelf;
var old_title;
var title;
var goal;

var tr_rows = 0;
var cr_rows = 0;
var fr_rows = 0;
var addBook = false;
var newBook = false;
var numBooks = 0;
var editingBook = null; // Track which book is being edited

// _________ ON OPEN _________
document.addEventListener('DOMContentLoaded', start);

function start() {
    var to_read = [];
    var curr_read = [];
    var fin_read = [];

    // Load saved books from storage
    chrome.storage.sync.get(["tr", "cr", "fr"], function(result) {
        if (result.tr) {
            to_read = result.tr;
            for (let i = 0; i < to_read.length; i++) {
                shelveBook(to_read[i]["title"], "to-read");
            }
        }
        if (result.cr) {
            curr_read = result.cr;
            for (let i = 0; i < curr_read.length; i++) {
                shelveBook(curr_read[i]["title"], "curr-read");
            }
        }
        if (result.fr) {
            fin_read = result.fr;
            for (let i = 0; i < fin_read.length; i++) {
                shelveBook(fin_read[i]["title"], "fin-read");
            }
        }
    });

    $(".show-book").hide();

    // _________ ONCLICK _________

    // add button (plus)
    $(".plus").on('click', function() {
        $("#show-book").show();
        addBook = true;
        newBook = true;
        editingBook = null;
        resetForm();
    })

    // save button
    $("#done").on('click', function() {
        book = {};
        book["title"] = $(".title").val();
        book["author"] = $(".author").val();
        book["stars"] = getRating();

        if (newBook == true && editingBook === null) {
            // Adding a new book
            to_read.push(book);
            shelveBook(book["title"], "to-read");
            chrome.storage.sync.get(["tr"], function(result) {
                var currentToRead = result.tr || [];
                currentToRead.push(book);
                chrome.storage.sync.set({ tr: currentToRead }).then(() => {
                    console.log("Book added to to-read");
                });
            });
        } else if (editingBook !== null) {
            // Editing an existing book
            updateBookInStorage(editingBook, book);
        }

        resetForm();
        $(".show-book").hide();
        addBook = false;
        newBook = false;
        editingBook = null;
    });

    // delete button (trash icon)
    $("#delete").on('click', function() {
        if (editingBook !== null) {
            // Delete the book being edited
            deleteBookFromStorage(editingBook);
        }
        $(".show-book").hide();
        resetForm();
        addBook = false;
        newBook = false;
        editingBook = null;
    });

    // click book to edit
    $(document).on('click', ".book", function(e) {
        addBook = true;
        newBook = false;
        var bookTitle = $(this).find('.book-title').text().trim();
        editingBook = bookTitle;
        loadBookForEditing(bookTitle);
        $(".show-book").show();
    });

    // _________ HOVER _________

    // hover over book
    $(document).on('mouseover', ".book", function() {
        if(addBook == false) {
            title = $(".book-title");
            showBook(title);
            $(".show-book").show();
        }
    });

    $(document).on('mouseleave', ".book", function() {
        if(addBook == false) {
            $('.show-book').hide();
        }
    });

    // _________ DRAG AND DROP _________

    // Make all book items draggable
    $(document).on('dragstart', '.book', function(e) {
        e.originalEvent.dataTransfer.setData('text/plain', $(this).find('.book-title').text().trim());
        $(this).addClass('dragging');
    });

    $(document).on('dragend', '.book', function(e) {
        $(this).removeClass('dragging');
    });

    // Make all display areas droppable
    $('.display-to-read, .display-curr-read, .display-fin-read').on('dragover', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
        $(this).addClass('drag-over');
    });

    $('.display-to-read, .display-curr-read, .display-fin-read').on('dragleave', function(e) {
        $(this).removeClass('drag-over');
    });

    $('.display-to-read, .display-curr-read, .display-fin-read').on('drop', function(e) {
        e.preventDefault();
        $(this).removeClass('drag-over');
        
        var bookTitle = e.originalEvent.dataTransfer.getData('text/plain');
        var draggedElement = $('.book').filter(function() {
            return $(this).find('.book-title').text().trim() === bookTitle;
        });
        
        if (draggedElement.length === 0) return;
        
        var targetShelf = getShelfFromElement($(this));
        var sourceShelf = getShelfFromElement(draggedElement.parent());
        
        if (targetShelf !== sourceShelf) {
            // Move the book element
            $(this).find('ul').append(draggedElement);
            
            // Update storage
            moveBookInStorage(bookTitle, sourceShelf, targetShelf);
        }
    });

    // _________ FUNCTIONS _________

    function loadBookForEditing(bookTitle) {
        chrome.storage.sync.get(["tr", "cr", "fr"], function(result) {
            var to_read = result.tr || [];
            var curr_read = result.cr || [];
            var fin_read = result.fr || [];
            
            // Search for the book in all shelves
            var book = null;
            for (var i = 0; i < to_read.length; i++) {
                if (to_read[i].title === bookTitle) {
                    book = to_read[i];
                    break;
                }
            }
            if (!book) {
                for (var i = 0; i < curr_read.length; i++) {
                    if (curr_read[i].title === bookTitle) {
                        book = curr_read[i];
                        break;
                    }
                }
            }
            if (!book) {
                for (var i = 0; i < fin_read.length; i++) {
                    if (fin_read[i].title === bookTitle) {
                        book = fin_read[i];
                        break;
                    }
                }
            }
            
            if (book) {
                // Populate the form with book data
                $(".title").val(book.title);
                $(".author").val(book.author);
                returnRating(book.stars || 0);
            }
        });
    }

    function updateBookInStorage(oldTitle, updatedBook) {
        chrome.storage.sync.get(["tr", "cr", "fr"], function(result) {
            var to_read = result.tr || [];
            var curr_read = result.cr || [];
            var fin_read = result.fr || [];
            
            // Find and update the book in the appropriate shelf
            var updated = false;
            
            // Check to-read shelf
            for (var i = 0; i < to_read.length; i++) {
                if (to_read[i].title === oldTitle) {
                    to_read[i] = updatedBook;
                    updated = true;
                    break;
                }
            }
            
            // Check currently-reading shelf
            if (!updated) {
                for (var i = 0; i < curr_read.length; i++) {
                    if (curr_read[i].title === oldTitle) {
                        curr_read[i] = updatedBook;
                        updated = true;
                        break;
                    }
                }
            }
            
            // Check finished-reading shelf
            if (!updated) {
                for (var i = 0; i < fin_read.length; i++) {
                    if (fin_read[i].title === oldTitle) {
                        fin_read[i] = updatedBook;
                        updated = true;
                        break;
                    }
                }
            }
            
            if (updated) {
                // Update the display
                updateBookDisplay(oldTitle, updatedBook.title);
                
                // Save to storage
                chrome.storage.sync.set({
                    tr: to_read,
                    cr: curr_read,
                    fr: fin_read
                }, function() {
                    console.log('Book updated: ' + oldTitle + ' -> ' + updatedBook.title);
                });
            }
        });
    }

    function deleteBookFromStorage(bookTitle) {
        chrome.storage.sync.get(["tr", "cr", "fr"], function(result) {
            var to_read = result.tr || [];
            var curr_read = result.cr || [];
            var fin_read = result.fr || [];
            
            var deleted = false;
            
            // Remove from to-read shelf
            for (var i = 0; i < to_read.length; i++) {
                if (to_read[i].title === bookTitle) {
                    to_read.splice(i, 1);
                    deleted = true;
                    break;
                }
            }
            
            // Remove from currently-reading shelf
            if (!deleted) {
                for (var i = 0; i < curr_read.length; i++) {
                    if (curr_read[i].title === bookTitle) {
                        curr_read.splice(i, 1);
                        deleted = true;
                        break;
                    }
                }
            }
            
            // Remove from finished-reading shelf
            if (!deleted) {
                for (var i = 0; i < fin_read.length; i++) {
                    if (fin_read[i].title === bookTitle) {
                        fin_read.splice(i, 1);
                        deleted = true;
                        break;
                    }
                }
            }
            
            if (deleted) {
                // Remove from display
                $('.book').filter(function() {
                    return $(this).find('.book-title').text().trim() === bookTitle;
                }).remove();
                
                // Save to storage
                chrome.storage.sync.set({
                    tr: to_read,
                    cr: curr_read,
                    fr: fin_read
                }, function() {
                    console.log('Book deleted: ' + bookTitle);
                });
            }
        });
    }

    function updateBookDisplay(oldTitle, newTitle) {
        $('.book').filter(function() {
            return $(this).find('.book-title').text().trim() === oldTitle;
        }).find('.book-title').text(' ' + newTitle);
    }

    function getShelfFromElement(element) {
        if (element.hasClass('display-to-read') || element.find('.display-to-read').length > 0) {
            return 'to-read';
        } else if (element.hasClass('display-curr-read') || element.find('.display-curr-read').length > 0) {
            return 'curr-read';
        } else if (element.hasClass('display-fin-read') || element.find('.display-fin-read').length > 0) {
            return 'fin-read';
        }
        return null;
    }

    function moveBookInStorage(bookTitle, fromShelf, toShelf) {
        chrome.storage.sync.get(["tr", "cr", "fr"], function(result) {
            var to_read = result.tr || [];
            var curr_read = result.cr || [];
            var fin_read = result.fr || [];
            
            var book = null;
            var sourceArray = null;
            var targetArray = null;
            
            // Find the book in the source array
            if (fromShelf === 'to-read') {
                sourceArray = to_read;
            } else if (fromShelf === 'curr-read') {
                sourceArray = curr_read;
            } else if (fromShelf === 'fin-read') {
                sourceArray = fin_read;
            }
            
            // Find and remove book from source
            for (var i = 0; i < sourceArray.length; i++) {
                if (sourceArray[i].title === bookTitle) {
                    book = sourceArray.splice(i, 1)[0];
                    break;
                }
            }
            
            if (book) {
                // Add to target array
                if (toShelf === 'to-read') {
                    targetArray = to_read;
                } else if (toShelf === 'curr-read') {
                    targetArray = curr_read;
                } else if (toShelf === 'fin-read') {
                    targetArray = fin_read;
                }
                
                targetArray.push(book);
                
                // Update storage
                chrome.storage.sync.set({
                    tr: to_read,
                    cr: curr_read,
                    fr: fin_read
                }, function() {
                    console.log('Book moved from ' + fromShelf + ' to ' + toShelf);
                });
            }
        });
    }
};

// _________ FUNCTIONS _________

/**
 * storage.sync:
 * to-read: [list of to-read books]
 * curr-read: [list of books reading]
 * fin-read: [list of read books]
 * 
 * book: {
 *  title: "sea of tranquility"
 *  author: "emily st john mandel"
 *  stars: 5
 * }
 */

function resetForm() {
    $(".title").val("");
    $(".author").val("");

    $("#star5").prop('checked', false);
    $("#star4").prop('checked', false);
    $("#star3").prop('checked', false);
    $("#star2").prop('checked', false);
    $("#star1").prop('checked', false);
    
    // Reset star colors
    $("#5, #4, #3, #2, #1").css("color", "");
}

// create book - not sure if this is necessary...
function createBook(title, new_a, new_r) {
    books[title] = {};
    setAuthor(title, new_a);
    setRating(title, new_r);
    setShelf(title, "to-read");
}

// delete book
function deleteBook(title) {
    if(books[title]) {
        delete books[title];
    } else {
        alert("book not found :(");
    }
    // figure out shelf
    unshelveBook(title, shelf);
}

// calculate num books finished
function getNumBooksFinished() {
    count = 0;
    for(var i in books) {
        if (books[i]["shelf"] == "fin-read") {
            count++;
        }
    }
    return count;
}

// get rating from stars...
function getRating() {
    numStars = 0;
    if($("#5").css("color") == "rgb(255, 199, 0)") {
        numStars = 5;
    } else if ($("#4").css("color") == "rgb(255, 199, 0)") {
        numStars = 4;
    } else if ($("#3").css("color") == "rgb(255, 199, 0)") {
        numStars = 3;
    } else if ($("#2").css("color") == "rgb(255, 199, 0)") {
        numStars = 2;
    } else if ($("#1").css("color") == "rgb(255, 199, 0)") { 
        numStars = 1;
    } else {
        numStars = 0;
    }

    return numStars
}

function returnRating(stars) {
    // Reset all stars first
    $("#5, #4, #3, #2, #1").css("color", "");
    
    if(stars == 5) {
        $("#5").css("color", "rgb(255, 199, 0)");
    } else if (stars == 4) {
        $("#4").css("color", "rgb(255, 199, 0)");
    } else if (stars == 3) {
        $("#3").css("color", "rgb(255, 199, 0)");
    } else if (stars == 2) {
        $("#2").css("color", "rgb(255, 199, 0)");
    } else if (stars == 1) { 
        $("#1").css("color", "rgb(255, 199, 0)");
    }
}

// set the textareas to the book elements instead of default 
function showBook(title) {
    editing = true;
    // chrome.storage.sync.get(['books'], function(result) {
    //     books = result.books;
    // });
    // error here accessing all elements
    $(".title").val(books[title]["title"]);
    $(".author").val(books[title]["author"]);
    returnRating(books[title]["rating"]);
}

// set book in the bookshelf
function shelveBook(title, shelf) {
    $(".display-" + shelf + " ul").append(
        '<li class="book" data-test="book-item" draggable="true"><i class="fa fa-book"></i><span class="book-title"> ' + title + '</span></li>'
    );
}

function unshelveBook(title, shelf) {
    $("span:contains(" + title + ")").closest('li').remove();
}
