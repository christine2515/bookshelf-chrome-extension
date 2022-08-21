// _________ VARIABLES _________
// var title, author, rating, shelf;
var title;
var goal;
var locked, editing; //for later...
var books = {}
var tr_rows = 0;
var cr_rows = 0;
var fr_rows = 0;

// _________ ON OPEN _________
document.addEventListener('DOMContentLoaded', start);

// data storage setup
function setStorage() {
    chrome.storage.local.set({
        'books': {},
        'set': 1,
    })
}

function start() {
    // $('.show-book').css('visibility','hidden'); 
    $(".show-book").hide();
    setStorage();


// $(document).on('ready', function(){
//     $('.show-book').css('visibility','visible'); 
// });


// _________ ONCLICK _________

    // add button (plus)
    $(".plus").on('click', function() {
        $("#show-book").show();
    })

    // save button
    $(".done").on('click', function() {
        editing = false;
        var title = $(".title").val();
        var author = $(".author").val();
        console.log(title);
        // var rating = 
        // FIGURE OUT RATING
        var rating = getRating($(".rating").val());
        saveBook(title, author, rating);
        $(".show-book").hide();
        shelveBook();
    });

    // delete button (trash icon)
    $("#delete").on('click', function() {
        $(".show-book").hide();
        // also remove the book from view of bookshelf
        var target = $(".title").val();
        deleteBook(target);
    });

    // change goal

    // click book to edit
    $("div.book").on('click', function(e) {
        var target = e.currentTarget;
        showBook(target);
        $(".show-book").show();
    });


    // _________ HOVER _________

    // hover over book
    $("div.book").on('mouseover', function(e) {
        var target = e.currentTarget;
        showBook(target);
        $(".show-book").show();
        // don't show save and delete buttons
    }) 

    $("div.book").on('mouseleave', function() {
        $('.show-book').hide();
    })

    // chrome.storage.local.get('books', function(result) {
    //     books = result.books;
    //     $('.books').val(books);
    // });
};

// _________ DRAG _________

// drag book to change status (aka shelf)


// _________ FUNCTIONS _________

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
        console.log("book not found :(");
    }
    // figure out shelf
    unshelveBook(title, shelf);

}



// edit book helper functions
function setTitle(title, t) {
    books[t] = books[title];
    deleteBook(title);
}

function setAuthor(title, a) {
    books[title]["author"] = a;
}

function setRating(title, r) {
    books[title]["rating"] = r;
}

function setShelf(title, s) {
    unshelveBook(title, shelf);
    shelveBook(title, shelf);
    chrome.storage.local.set({
        'books': books
        // don't want to save shelf in savebook bc can't save shelf manually...yet
    })

}

// save book
function saveBook(title, new_t, new_a, new_r) {
    setTitle(title, new_t);
    setAuthor(new_t, new_a);
    setRating(new_t, new_r);
    shelveBook();
    // setStatus(new_t, new_s);
    chrome.storage.sync.set({"test": "test"}, function() {
        alert('Succes');
    });
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

function getRating(stars) {

}

// set the textareas to the book elements instead of default 
function showBook(book_title) {
    // $(".title").html(books[book_title]);
    // $(".author").html(books[book_title]["author"]);
    // do rating

    // make this show the title, author, etc. if there are any
    // rating might be difficult...
}

// set book in the bookshelf
function shelveBook(title, shelf) {
    var rows;
    if(shelf == "display-to-read") {
        rows = tr_rows;
    } else if(shelf == "display-curr-read") {
        rows = cr_rows;
    } else {
        rows = fr_rows;
    }

    $('.display-' + shelf).append(
        `<tr id="R${++rows}">
            <td class="row-index">
                <div class="book">
                    <i class="fa fa-book" style="display: inline-block; margin-left: 5px;"></i>
                    <p style="display: inline-block;">R${title}</p>
        
                </div>
            </td>
        </tr>`
    )
}

function unshelveBook(title, shelf) {
    var rows;
    if(shelf == "display-to-read") {
        rows = tr_rows;
    } else if(shelf == "display-curr-read") {
        rows = cr_rows;
    } else {
        rows = fr_rows;
    }

    var child = $(this).closest('tr').nextAll();
    child.each(function() {
        var id = $(this.attr('id'));
        var dig = parseInt(id.substring(1));
        $(this).attr('id', `R${dig-1}`);
    });

    $(this).closest('tr').remove();
    // FIX LATER!!
}
