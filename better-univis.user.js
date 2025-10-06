// ==UserScript==
// @name        Better UnivIS
// @namespace   Violentmonkey Scripts
// @match       *://univis.uni-kiel.de/*
// @grant       none
// @version     1.0
// @author      HappyH
// @description Verbessert UnivIS
// @require     https://unpkg.com/darkreader@4.9.105/darkreader.js#sha512=2b7f8f0cb074b0f1ca650f8feb81e345232a9f973257481dc0f56e8fcabb44f052e591f9039b684490c4e650bb71024f365fa085539a4213ad21bd7f15d28e93
// @run-at      document-body
// ==/UserScript==

// get element by its image source
function getImgBySrc(src) {
    return document.querySelector(`img[src='${src}']`)
}

// change main font to Bahnschrift
function changeFont() {
    let bodyElement = document.getElementsByTagName("body")
        if (bodyElement) {
        bodyElement = bodyElement[0]

        const styles = {
            fontFamily: 'Bahnschrift, Helvetica, Sans Serif'
        }
        Object.assign(bodyElement.style, styles)
    }
}

// remove the big CAU image that links to the CAU Main page
function removeCAULink() {
    const cauElement = document.querySelector("td[bgcolor='#eeeeee'][width='148'][rowspan='2']")
    const bgElement = document.querySelector("td[colspan='1'][rowspan='2'][bgcolor='#003366'][width='1']")
    const sideElement = document.querySelector("table[width='100%'] tbody")
    if (cauElement && bgElement && sideElement) {
        cauElement.remove()
        bgElement.remove()
        try {
            sideElement.children[1].children[0].children[0].children[0].children[0].remove()
        } catch {
            console.log("side element could not be removed")
        }
    }
}

// change the menu to be in a coherent style
// run after removeCauLink
function menu() {
    // style for different menu elements
    const Style = `
.navbar {
  overflow: hidden;
}

.navbar a {
  float: left;
  font-size: 16px;
  color: white;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
}

.dropdown {
  float: left;
  overflow: hidden;
}

.dropdown .dropbtn {
  text-align: center;
  font-size: 16px;
  border: none;
  outline: none;
  color: white;
  padding: 14px 16px;
  background-color: inherit;
  font-family: inherit;
  margin: 0;
}

.navbar a:hover, .dropdown:hover .dropbtn {
  background-color: #ddd;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

.dropdown-content a {
  float: none;
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
}

.dropdown-content a:hover {
  background-color: #ddd;
}

.dropdown:hover .dropdown-content {
  display: block;
}

    `
    const stylesheet = document.createElement("style")
    stylesheet.innerText = Style
    document.head.appendChild(stylesheet)

    // constant to hold all menu elements with their links that exist
    const menuElems = {}
    const _menuHeader = document.querySelector("td[nowrap=''][valign='middle']")

    // Elements of the black top header

    // get sammlung/stundenplan link
    const sammlungImg = getImgBySrc("/img/anew/samm_inv.gif")
    if (sammlungImg) {
        const sammlungLink = menuElems.sammlung = sammlungImg.parentElement.getAttribute("href")
        menuElems.sammlung = [sammlungLink, "📅 Sammlung"]
    }

    // get Home link
    var xpath = "//b[text()='Home']";
    const homeText = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (homeText) {
        const HomeLink = homeText.parentElement.parentElement.getAttribute("href")
        menuElems.home = [HomeLink, "🏠 Home"]
    }

    // get Language link
    const languageSelector = document.querySelector("input[name='English'], input[name='German']")
    if (languageSelector) {
        // get the hidden input as well
        const languageHiddenInput = document.querySelector("input[type='hidden'][name='submitimg-English'], input[type='hidden'][name='submitimg-German']")
        menuElems.language = [[languageSelector, languageHiddenInput], "🌐 Sprache"]
    }

    // Elements of the lower top header

    // get Search-element
    const searchSelect = document.querySelector("select[name='search']")
    if (searchSelect) {
        // also fix the image color
        searchSelect.nextElementSibling.nextElementSibling.setAttribute("style", "filter:invert(93%)")
        searchSelect.parentElement.parentElement.removeAttribute("valign")
        menuElems.search = [searchSelect.parentElement.parentElement, "🔎 Search"]
    }

    // get Semester-select-element
    const semesterSelect = document.querySelector("select[name='semto']")
    if (semesterSelect) {
        // also fix the image color
        semesterSelect.nextElementSibling.nextElementSibling.setAttribute("style", "filter:invert(93%)")
        semesterSelect.parentElement.parentElement.removeAttribute("align")
        menuElems.semester = [semesterSelect.parentElement.parentElement, "🏫 Semester"]
    }

    // Side elements (differ from page to page)

    const sideMenuElem = document.querySelector("td[width='150'][valign='top'][height='100%'][bgcolor='#ffffff']")
    const sideMenu = {}
    if (sideMenuElem) {
        var previous = "undefined"
        // go through all tables that exist in this side menu - they contain the menu elements
        for (sideMenuTable of sideMenuElem.children) {
            const headingElem = sideMenuTable.querySelector("b")
            const sideElemLinks = sideMenuTable.querySelectorAll("a")
            if (headingElem) {
                const heading = headingElem.innerText
                previous = heading
                sideMenu[heading] = sideElemLinks
            } else {
                // if the heading doesn't exist, then the table probably belongs under the previous table's heading
                // if not, then they are under "Undefined"
                if (Object.hasOwn(sideMenu, previous)) {
                    sideMenu[previous].push.apply(sideMenu[previous], sideElemLinks)
                } else {
                    sideMenu[previous] = sideElemLinks
                }
            }
        }
        // remove the side element and reposition the central element
        const mainElem = sideMenuElem.nextElementSibling
        sideMenuElem.innerHTML = ''
        sideMenuElem.setAttribute("width", "10%")
        mainElem.children[0].setAttribute("width", "90%")
    }

    // add all elements to the menu
    // Have to do it manually, to get it in the order I want
    if (_menuHeader) {
        const menuHeader = _menuHeader.parentElement
        menuHeader.setAttribute("class", "navbar")

        // function for adding a new element to the menu header
        function addToMenu(elem) {
            let td = document.createElement("td")
            td.setAttribute("nowrap", "")
            let font = document.createElement("font")
            font.setAttribute("color", "#000000")
            font.setAttribute("size", "2")
            if (Array.isArray(elem)) {
                for (e of elem) {
                    font.appendChild(e)
                }
            } else {
                font.appendChild(elem)
            }
            td.appendChild(font)
            menuHeader.appendChild(td)
        }

        // manually add elements
        for (element of ["home", "sammlung"]) {
            if (menuElems[element]) {

                menuItem = document.createElement("a")
                menuItem.setAttribute("href", menuElems[element][0])
                menuItem.setAttribute("class", "nav-link")
                menuItem.innerText = menuElems[element][1]

                menuHeader.appendChild(menuItem)
                //addToMenu(createLinkButton(menuElems[element][0], menuElems[element][1]))
            }
        }

        // add the elements from the side menu

        for (heading of Object.keys(sideMenu)) {
            // create a dropdown menu that has all the links under the current heading
            dropdownElem = document.createElement("div")
            dropdownElem.setAttribute("class", "dropdown")

            dropdownButton = document.createElement("div")
            dropdownButton.setAttribute("class", "dropbtn")
            dropdownButton.innerText = heading

            dropdownContent = document.createElement("div")
            dropdownContent.setAttribute("class", "dropdown-content")

            for (link of sideMenu[heading]) {
                dropdownContent.appendChild(link)
            }

            dropdownElem.appendChild(dropdownButton)
            dropdownElem.appendChild(dropdownContent)

            menuHeader.appendChild(dropdownElem)
        }

        for (element of ["search", "semester"]) {
            menuHeader.appendChild(menuElems[element][0])
        }

        // add the language option last
        if (menuElems.language) {
            addToMenu(menuElems.language[0])
        }


    }

    // delete the now unnecessary elements, if they exist
    const topHeader = document.querySelector("td[bgcolor='#000000'][width='114']")
    if (topHeader) {
        topHeader.parentElement.remove()
    }
}

// Display a counter how many modules are in this category (WP inf) (WIP)
function countModules() {
    // todo: make this work if there is also titles between the modules
    const mainTable = document.querySelector("table[border='0'][width='100%'][cellspacing='17'][cellpadding='0'] tbody")
    if(mainTable) {
        try {
            const modules = mainTable.children[1].children[0].children[3].children[0].children
            if (modules.length > 0) {
                let count = 0
                for (mod of modules) {
                    if (mod.innerText.match('V;')) {
                        count++
                    }
                }
                const heading = mainTable.children[1].children[0].children[0]
                heading.innerText = `${heading.innerText} (${count} modules)`
            }
        } catch {
            // we are not in a table with modules
            console.log("Main table not found")
        }
    }
}

// group modules by their ECTS
// todo: if you choose to "show all modules under this heading", this is still very janky
function groupByECTS() {
    // find the main table
    const mainTable = document.querySelector("h2 ~ table")
    if (mainTable) {
        const bgcolor = "#eeeeee"
        const entries = mainTable.children[0].children
        const ectsAndModules = {};

        // make table a little prettier
        mainTable.setAttribute("cellspacing", "0")
        mainTable.setAttribute("cellpadding", "7")

        // go through each entry in the table, and add them to a dictionary corresponding to the nr. of ECTS
        let ects = "undefined"
        let previous = ects
        for (entry of entries) {
            const small = entry.querySelector("h4 ~ small")
            if (small) {
                const infotext = small.innerText
                // these are the two types of ways I've seen ECTS indicated in the text
                const i = infotext.indexOf("ECTS: ") // nr of ects after
                const j = Math.max(
                    infotext.indexOf("ECTS;"),  // two different possible ECTS numbers before, I take the second
                    infotext.indexOf("ETC;") ,  // same, but sometimes the S is not included for some reason
                    infotext.indexOf("ECTS,")   // occasionally comma instead of semicolon
                )
                if (i > -1) {
                    ects = infotext.substring(i + 6, i + 8)
                    if (ects[1] == ";") {
                        ects = ects[0]
                    }
                } else if (j > -1) {
                    ects = infotext.substring(j - 3, j - 1)
                    ects = ects.trim()
                // if it is an exercise, I rely on the fact that the previous entry was the corresponding VL.
                // todo: sometimes this does not work, especially with other kinds of modules than VL/Ü (seminars, etc)
                } else if (!infotext.match("V;")){
                    ects = previous
                } else {
                    ects = "undefined"
                }
            } else {
                // the small exercises for Math modules land here
                ects = previous
            }
            if(Object.hasOwn(ectsAndModules, ects)) {
                ectsAndModules[ects].push(entry)
            } else {
                ectsAndModules[ects] = [entry]
            }
            previous = ects
        }
        // add them again, with headings <h3> which ECTS it is
        let hasColor = false
        let ectss = Object.keys(ectsAndModules)
        ectss.sort()
        for (ects of ectss) {
            const headingrow = document.createElement("tr")
            const headingcol = document.createElement("td")
            const heading = document.createElement("h3")
            headingrow.setAttribute("valign", "top")
            headingcol.setAttribute("colspan", "4")
            heading.innerText = ects + " ECTS"
            headingrow.appendChild(headingcol)
            headingcol.appendChild(heading)
            mainTable.children[0].appendChild(headingrow)
            for (entry of ectsAndModules[ects]) {
                const small = entry.querySelector("h4 ~ small")
                if (small) {
                    if (!small.innerText.match("UE")) {
                        hasColor = !(hasColor && true)
                    }
                }
                if (hasColor) {
                    entry.setAttribute("bgcolor", bgcolor)
                } else {
                    entry.removeAttribute("bgcolor")
                }
                mainTable.children[0].appendChild(entry)
            }
        }
    }
}

// removes the useless checkboxes and replaces the useful but ugly ones with pretty ones
function replaceCheckboxes() {
    // remove the useless checkboxes
    const uselessCheckboxes = document.querySelectorAll("input[type='checkbox']")
    if (uselessCheckboxes) {
        for (checkbox of uselessCheckboxes) {
            checkbox.remove()
        }
    }

    // remove the useless "Auswahl hinzufügen" options
    const optionNames = ["hinzufügen", "löschen", "einschränken"]
    const uselessOptions = optionNames.map(name => document.querySelectorAll(`input[name='${name}']`))
    if (uselessOptions.reduce((acc, cur) => acc && cur)) {
        for (options of uselessOptions) {
            for (option of options) {
                option.remove()
            }
        }
    }

    // replace the ugly checkbox images with better images
    // todo: it is not easily possible to replace the images with actual html checkboxes. Maybe find out how?
    const checkboxNames = ["samm", "samm_yes"]
    const uglyCheckboxes = checkboxNames.map(
        name => [
            name, document.querySelectorAll(`input[type='image'][src='/img/anew/${name}.gif']`)
        ])
    const style = "filter:invert(93%)"
    if (uglyCheckboxes.reduce((acc, cur) => acc && cur[1])) {
        for ([checkboxName, checkboxes] of uglyCheckboxes) {
            for (checkbox of checkboxes) {
                checkbox.setAttribute("width", "30px")
                checkbox.setAttribute("height", "30px")
                checkbox.setAttribute("style", style)
                if (checkboxName == "samm") {
                    checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg")
                } else {
                    checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg")
                }
            }
        }
    }
}

// uses Dark Reader to enable dark mode on the site 
// todo: add light mode option
function darkMode() {
    // todo: add option to disable dark mode
    DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10
    })
}

// replaces the logo with a pride version
function prideLogo() {
    const logo = document.querySelectorAll("img[src='/img/anew/univis_96_20.gif'], img[src='img/anew/univis_96_20.gif']")
    for (instance of logo) {
        instance.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/logo.png")
    }
}

// improves the list of links to look a little less overwhelming
function prettierList() {
    const Style = `
ul {
    list-style-type: none;
    -moz-column-count: 4;
    -moz-column-gap: 20px;
    -webkit-column-count: 4;
    -webkit-column-gap: 20px;
    column-count: 4;
    column-gap: 20px;
}
ul li {
    width: 100%;
}
ul a {
    display: inline-block;
    text-decoration: none;
    padding:10px;
    color: black;
    width: 100%;
}
ul a:hover {
    background-color: #ddd
}
ul a .alternate {
    background-color: #eeeeee;
}
    `
    const stylesheet = document.createElement("style")
    stylesheet.innerText = Style
    document.head.appendChild(stylesheet)

    linklist = document.querySelector("ul")
    if (linklist) {
        // sort long lists alphabetically 
        if (linklist.children.length >= 15) {
            children = Array.from(linklist.children)
            children.sort((c1, c2) => c1.innerText.localeCompare(c2.innerText))
            console.log(children)
        }
    }
}

// runs all of the functions. caution: order important
function runAllImprovements() {
    changeFont()
    darkMode()
    countModules()
    removeCAULink()
    replaceCheckboxes()
    menu()
    prideLogo()
    prettierList()
    groupByECTS()
}

// main part of the user script
(function() {
    'use strict';
    console.log("This is betterUnivIS, starting up")
    window.addEventListener("load",runAllImprovements,false)
})();

// todo: remove navigation links that lead nowhere / contain no sub-links or directories / modules
// todo: make navigation elements prettier, not ul of links
// todo: make links look prettier, especially module titles (no underline, other effect instead, make table entry clickable)
// todo: sort by (options) with headers for each step
// todo: Filter (ects > x or something, hide exercises, ...)
// todo: show map next to room on details page or something
// todo: prettyfy the basic infotext of the modules - align dates vertically and so on
