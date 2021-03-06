const {remote} = require('electron');
const {dictionary} = remote.require('./main.js');
const DictionaryAPI = remote.require('./src/js/DictionaryAPI.js');

let showAll = false;
let speech = false;
displayDefaultContent();

document.getElementById("searchField").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        submitSearch();
    }
});

function openTranslateModal(word){
    canceladd();
    canceledit();
    const modal = document.getElementById("translateModal");
    document.getElementById('translatedWordlbl').innerHTML = word;
   
    modal.style.minHeight = "240pt";
    modal.style.minWidth = "350pt";
    modal.style.display = "block";
    
}

function translateWord(){
    const language = document.getElementById('translateInput').value;
    if(language==="Arabic"){
        document.getElementById('translatedWordlbl').style.textAlign= "right";
    }
    else {
        document.getElementById('translatedWordlbl').style.textAlign= "left";  
    }
}

function textToSpeech(word,child){
    if (speech) return;
    speech = true;
    child.style.color = "red";
    var msg = new SpeechSynthesisUtterance(word);    
    msg.onend = function(e){
        speech = false;
        child.style.color = "#CCC";
    }
    window.speechSynthesis.speak(msg);
}
function openAddModal() {
    canceledit();
    cancelTranslate();
    const modal = document.getElementById("add");
    modal.style.minHeight = "270pt";
    modal.style.minWidth = "350pt";
    modal.style.display = "block";
}

function addWord() {
    const word =  document.getElementById('nameinput').value;
    const type = document.getElementById('typeinput').value;
    const definition = document.getElementById('difinput').value;
    let err = "";
    if (!word.length) {
        err = "You Should Enter A Word.";
    } else if (!type.length) {
        err = "You Should Enter A Type.";
    } else if (!definition.length) {
        err = "You Should Enter A Definition.";  

    } else if (dictionary.contains(word)) {
        err = "This word is already in the dictionary.";
    } else {
        dictionary.insert(word, type, definition);
        renderElements(dictionary.search(word));
        document.getElementById('searchField').value = word;
        document.getElementById("add").style.display = "none";

        document.getElementById('nameinput').value = null;
        document.getElementById('typeinput').value = "";
        document.getElementById('difinput').value = null;
        return;
    }
    alert(err);
}

function appendWord(word, definition, type) {
    let main = document.getElementById('division');
    let element = document.getElementById('required').cloneNode(true);

    let wordElement = element.childNodes[1].childNodes[1];
    let typeElement = element.childNodes[1].childNodes[3];
    let defElement = element.childNodes[3];
    let iconsDiv = element.childNodes[5];
    iconsDiv.childNodes[5].addEventListener('click', function(e) {
        openEditModal(word, type, definition);
    });

    iconsDiv.childNodes[7].addEventListener('click', function(e) {
        let confirmation = confirm('Are you sure you want to delete this word?');
        if (confirmation) {
            deleteWord(word);
        }
    });
     iconsDiv.childNodes[1].addEventListener('click', function(e) {
        textToSpeech(word,iconsDiv.childNodes[1]);
    });
    iconsDiv.childNodes[3].addEventListener('click', function(e) {
        openTranslateModal(word);
    });

    wordElement.innerHTML = word;
    typeElement.innerHTML = `.${type}.`;
    defElement.innerHTML = definition;

    element.style.display = 'block';
    main.appendChild(element);
}

function deleteWord(word) {
  
    dictionary.delete(word);
    if (showAll) {
        renderElements(dictionary.getAll());
    } else {
        const query = document.getElementById('searchField').value;
        renderElements(dictionary.search(query));
    }
}

function editWord() {
    const word =  document.getElementById('wordlbl').textContent;    
    const type = document.getElementById('editTypeInput').value;
    const definition = document.getElementById('editDifInput').value;
    let err = "";
    if (!type.length) {
        err = "You Should Enter A Type.\n";
    } else if (!definition.length) {
        err = "You Should Enter A Definition."; 
    } else {
        dictionary.edit(word, type, definition);
        if (showAll) {
            renderElements(dictionary.getAll());
        } else {
            renderElements(dictionary.search(document.getElementById('searchField').value));
        }
        document.getElementById("editmodal").style.display = "none";
        return;
    }
    alert(err);
}

function openEditModal(word, type, definition) {
    canceladd();
    cancelTranslate();
    const modal = document.getElementById("editmodal");

    document.getElementById('wordlbl').innerHTML = word;
    document.getElementById('editTypeInput').value = type;
    document.getElementById('editDifInput').value = definition;
    
    modal.style.minHeight = "260pt";
    modal.style.minWidth = "350pt";
    modal.style.display = "block";
}

function canceledit() {
    document.getElementById("editmodal").style.display = "none";    
}

function canceladd() {
    document.getElementById("add").style.display = "none";
}
function cancelTranslate(){
    document.getElementById("translateModal").style.display = "none";
    
}
function submitSearch() {
    showAll = false;    
    const query = document.getElementById('searchField').value;

    hideLoader();    

    if (!query) {
        displayDefaultContent();
        return;
    };
    
    let searchResult = dictionary.search(query);
    if (searchResult) {
        renderElements(dictionary.search(query));
    } else {
        let main = document.getElementById('division');
        main.innerHTML = `
            <div id="SearchResultDiv" style="display: flex; align-items: center; justify-content: center; flex-direction: column; margin-top: 100pt">
                <p>No results found</p>
                <button 
                    type="submit"
                    class="addBtn"
                    onclick="searchOnline()"
                    style="width: 240pt; height: 40pt; font-size: medium"
                >
                    Get the Definition from the Internet
                </button>
            </div>
        `;
    }
    
}

function showAllFunc() {
    hideLoader();
    showAll = true;
    
    document.getElementById('searchField').value = null;
    if(dictionary.length()!=0){
        renderElements(dictionary.getAll());
        }
        else{
            let main = document.getElementById('division');
            main.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; margin-top: 100pt">
                    <p>There are no Words in the Dictionary</p>
                </div>
            `;
        }}

function renderElements(result) {
    document.getElementById('division').innerHTML = null;
    for (let word of result) {
        appendWord(word.word, word.definition, word.type);
    }
}

function searchOnline() {
    const query = document.getElementById('searchField').value;
    showLoading();
    document.getElementById('SearchResultDiv').style.display = "none"
    DictionaryAPI.getDefinition(query).then(definition => {
        hideLoader();
        dictionary.insert(query, 'noun', definition);
        renderElements(dictionary.search(query));
        console.log(definition);
    }).catch(err => {
        hideLoader();        
        alert('Sorry an error occured.');
        console.log(err);
    });
}

function displayDefaultContent() {
    let main = document.getElementById('division');
    main.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; margin-top: 100pt">
            <p>Search for a Word defintion to show results</p>
        </div>
    `;
}

function hideLoader(){
    document.getElementById("loading").style.display = "none";
}

function showLoading() {
    document.getElementById("loading").style.display = "block";
}