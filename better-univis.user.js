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

const mainStyle = `
a {
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
`
// returns true iff language is set to german
function german() {
    return !!document.querySelector("input[name='English']")
}

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

// change the menu to be in a coherent style
function menu() {
    // style for different menu elements
    const Style = `
.pride-logo {
  max-height: 50px;
}

.navbar {
  position: fixed;
  top: 0;
  background-color: #eeeeee;
  width: 100%;
  height: 50px;
  z-index: 999;
}

.nav-container {
  background-color: #eeeeee;
}

.nav-placeholder {
  height: 50px;
}

.nav-right {
  float: right;
  text-align: center;
  padding: 14px;
}

.nav-right#mode {
  height: 40px;
  padding: 5px;
  width: 5%;
  display: flex;
  justify-content: center;
}

.nav-right#mode:hover {
  background-color: #dddddd;
  cursor: pointer;
}

.nav-right#mode img {
  height: 40px;
  margin: auto;
}


#language {
  width: 5%;
  padding: 18px;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  justify-content:center;
}

#language img {
  margin: auto;
}

#oldsemester {
  display: none;
}

#oldsearch {
  display: none;
}

.navbar img {
  float: left;
}

.navbar a {
  float: left;
  font-size: 16px;
  color: black;
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
  color: black;
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
  max-height: 30vh;
  overflow: scroll;
}

.dropdown-content a, .dropdown-content div {
  cursor: pointer;
  float: none;
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
}

.dropdown-content a:hover, .dropdown-content div:hover{
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

    // Elements of the black top header

    // get sammlung/stundenplan link
    const sammlungImg = getImgBySrc("/img/anew/samm_inv.gif")
    if (sammlungImg) {
        const sammlungLink = menuElems.sammlung = sammlungImg.parentElement.getAttribute("href")
        if (german()) {
            menuElems.sammlung = [sammlungLink, "📅 Sammlung"]
        } else {
            menuElems.sammlung = [sammlungLink, "📅 Collection"]
        }
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
        if (german()) {
            menuElems.search = [searchSelect.parentElement.parentElement, "🔎 Suche"]
        } else {
            menuElems.search = [searchSelect.parentElement.parentElement, "🔎 Search"]
        }
    }

    // get Semester-select-element
    const semesterSelect = document.querySelector("select[name='semto']")
    if (semesterSelect) {
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

    // create the new nav bar in all cases
    const newMenu = document.createElement("nav")
    newMenu.setAttribute("class", "navbar")
    const navDiv = document.createElement("div")
    navDiv.setAttribute("class", "nav-container")
    const navPlaceholder = document.createElement("div")
    navPlaceholder.setAttribute("class", "nav-placeholder")
    newMenu.appendChild(navDiv)

    // add the pride logo to the menu
    const logo = document.createElement("img")
    logo.setAttribute("class", "pride-logo")
    logo.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/logo.svg")
    logo.setAttribute("alt", "UnivIS")
    if (german()) {
        logo.setAttribute("title", "Informationssystem der Universität Kiel")
    } else {
        logo.setAttribute("title", "Information system of Kiel University")
    }
    logo.setAttribute("width", "10%")
    navDiv.appendChild(logo)

    // add all elements to the menu

    // add Home and Sammlung links, if they exist
    for (element of ["home", "sammlung"]) {
        if (element in menuElems) {
            menuItem = document.createElement("a")
            menuItem.setAttribute("href", menuElems[element][0])
            menuItem.setAttribute("class", "nav-link")
            menuItem.innerText = menuElems[element][1]

            navDiv.appendChild(menuItem)
        }
    }

    // add the search and semester options in new style

    for (element of ["search", "semester"]) {
        if (element in menuElems) {
            const dropdownElem = document.createElement("div")
            dropdownElem.setAttribute("class", "dropdown")

            const dropdownButton = document.createElement("div")
            dropdownButton.setAttribute("class", "dropbtn")
            dropdownButton.innerText = menuElems[element][1]

            // display current semester in semester dropdown
            if (element == "semester") {
                dropdownButton.innerText = `${dropdownButton.innerText}: ${semesterSelect.value}`
            }

            const dropdownContent = document.createElement("div")
            dropdownContent.setAttribute("class", "dropdown-content")

            const old = menuElems[element][0]
            const options = old.children[0].children[0].children

            // add the options to the dropdown
            for (option of options) {
                const selectOption = document.createElement("div")
                selectOption.innerText = option.innerText
                selectOption.setAttribute("value",option.getAttribute("value"))

                // add corresponding event listeners
                if (element == "search") {
                    selectOption.addEventListener('click', search)
                } else {
                    selectOption.addEventListener('click', semester)
                }
                dropdownContent.appendChild(selectOption)
            }
            dropdownElem.appendChild(dropdownButton)
            dropdownElem.appendChild(dropdownContent)
            navDiv.appendChild(dropdownElem)

            // hide old options (css)
            const hidden = document.createElement("div")
            hidden.setAttribute("id", `old${element}`)
            hidden.appendChild(old)
            navDiv.appendChild(hidden)
        }
    }

    // add the elements from the side menu

    for (heading of Object.keys(sideMenu)) {
        // create a dropdown menu that has all the links under the current heading
        const dropdownElem = document.createElement("div")
        dropdownElem.setAttribute("class", "dropdown")

        const dropdownButton = document.createElement("div")
        dropdownButton.setAttribute("class", "dropbtn")
        dropdownButton.innerText = heading

        const dropdownContent = document.createElement("div")
        dropdownContent.setAttribute("class", "dropdown-content")

        for (link of sideMenu[heading]) {
            dropdownContent.appendChild(link)
        }

        dropdownElem.appendChild(dropdownButton)
        dropdownElem.appendChild(dropdownContent)

        navDiv.appendChild(dropdownElem)
    }

    // add the language option

    if (menuElems.language) {
        const div = document.createElement("div")
        div.setAttribute("class", "nav-right")
        div.setAttribute("id", "language")
        for (item of menuElems.language[0]) {
            div.appendChild(item)
        }
        navDiv.appendChild(div)
    }

    // add light mode/dark mode option
    const lightdiv = document.createElement("div")
    lightdiv.setAttribute("class", "nav-right")
    lightdiv.setAttribute("id", "mode")
    const lightbutton = document.createElement("img")
    lightbutton.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/darkmode.svg")
    if (DarkReader.isEnabled()) {
        lightbutton.setAttribute("style", "filter:invert(93%)")
    }
    lightdiv.appendChild(lightbutton)
    navDiv.appendChild(lightdiv)
    lightdiv.addEventListener("click", toggleMode)

    // append the new menu to the top of the document
    const mainForm = document.body.querySelector("form")
    if (mainForm) {
        mainForm.prepend(navPlaceholder)
        mainForm.prepend(newMenu)
    }

    // delete the now unnecessary elements, if they exist
    const mainTable = document.body.querySelector("table tbody")
    if (mainTable) {
        tableHTML = mainTable.innerHTML
        let end = tableHTML.indexOf("<!-- END of unihd -->")
        let toDelete = tableHTML.substring(0, end)
        tableHTML = tableHTML.replace(toDelete, '')
        mainTable.innerHTML = tableHTML
    }
}

// Display a counter how many modules are in this category (WP inf) (WIP)
function countModules() {
    // todo: make this work if there is also titles between the modules
    const moduleTableElement = document.querySelector("tbody tr[valign='top'][bgcolor='#eeeeee']")
    if(moduleTableElement) {
        const modules = moduleTableElement.parentElement.children
        let count = 0
        for (mod of modules) {
            // count everything except Exercises
            if (mod.innerText.match(/\sV;|\sS;|\sPRUE/)) {
                count++
            }
        }
        const heading = document.querySelector("h2")
        if (heading) {
            heading.innerText = `${heading.innerText} (${count} modules)`
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
                // todo: sometimes this does not work, especially with other kinds of modules than VL/Ü (seminars, etc), or if a VL is labelled not as V; but as V/UE;
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
    const optionNames = ["hinzufügen", "löschen", "einschränken", "anzeigen"]
    const uselessOptions = optionNames.map(name => document.querySelectorAll(`input[name='${name}']`))

    for (options of uselessOptions) {
        for (option of options) {
            option.remove()
        }
    }

    // replace the ugly checkbox images with better images
    // todo: it is not easily possible to replace the images with actual html checkboxes. Maybe find out how?
    const checkboxNames = ["samm", "samm_yes"]
    const uglyCheckboxes = checkboxNames.map(
        name => [
            name, document.querySelectorAll(`input[type='image'][src='/img/anew/${name}.gif']`)
        ]
    )
    const darkStyle = "filter:invert(93%)"
    for ([checkboxName, checkboxes] of uglyCheckboxes) {
        for (checkbox of checkboxes) {
            checkbox.setAttribute("width", "30px")
            checkbox.setAttribute("height", "30px")
            if (DarkReader.isEnabled()) {
                checkbox.setAttribute("style", darkStyle)
            }
            if (checkboxName == "samm") {
                checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg")
            } else {
                checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg")
            }
        }
    }

    // replace the ugly checkboxes from the timetable view
    // todo: center checkboxes
    const timetableCheckboxNames = ["checkb", "checkb_s"]
    const timetableCheckboxes = timetableCheckboxNames.map(
        name => [
            name, document.querySelectorAll(`img[src='/img/anew/${name}.gif']`)
        ]
    )
    for ([checkboxName, checkboxes] of timetableCheckboxes) {
        for (checkbox of checkboxes) {
            checkbox.setAttribute("width", "20px")
            checkbox.setAttribute("height", "20px")
            checkbox.removeAttribute("align")
            if (DarkReader.isEnabled()) {
                checkbox.setAttribute("style", darkStyle)
            }
            if (checkboxName == "checkb") {
                checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg")
            } else {
                checkbox.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg")
            }
        }
    }
}

// uses Dark Reader to enable dark mode on the site 
function toggleMode() {
    const currentTheme = document.body.className;
    if (currentTheme == "dark") {
        document.body.className = "light"
        DarkReader.disable()
    } else {
        document.body.className = "dark"
        DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10
        })
    }
    localStorage.setItem("theme", document.body.className)
    location.reload()
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
@media screen and (max-width: 1200px) {
    ul {
        column-count: 3;
        -webkit-column-count: 3;
        -moz-column-count: 3;
    }
}
@media screen and (max-width: 900px) {
    ul {
        column-count: 2;
        -webkit-column-count: 2;
        -moz-column-count: 2;
    }
}
@media screen and (max-width: 500px) {
    ul {
        column-count: 1;
        -webkit-column-count: 1;
        -moz-column-count: 1;
    }
}
ul li {
    width: 100%;
}
ul a {
    display: inline-block;
    text-decoration: none;
    padding:10px;
    width: 100%;
}
ul a:hover {
    background-color: #ddd;
    text-decoration: none;
}
ul a .alternate {
    background-color: #eeeeee;
}
    `
    const stylesheet = document.createElement("style")
    stylesheet.innerText = Style
    // look for certain <input> tags that only exist on pages where we don't want the new style
    const dont_style = ["pers", "lvs", "rooms"]
    const check = dont_style.map(name => document.querySelector(`input[name='${name}']`)).reduce((acc, cur) => acc || cur)
    if (!check) {
        document.head.appendChild(stylesheet)
    }
}

function responsiveWebdesign() {
    meta = document.createElement("meta")
    meta.setAttribute("name", "viewport")
    meta.setAttribute("content", "width=device-width, initial-scale=1.0")
    document.head.appendChild(meta)
}

// runs all of the functions. caution: order important
function runAllImprovements() {
    const stylesheet = document.createElement("style")
    stylesheet.innerText = mainStyle
    document.head.appendChild(stylesheet)
    responsiveWebdesign()
    changeFont()
    const theme = localStorage.getItem("theme") || "dark"
    document.body.className = theme
    if (theme == "dark") {
        DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10
        })
    }
    countModules()
    replaceCheckboxes()
    menu()
    prettierList()
    groupByECTS()
}

// functionality of the new search and semester dropdowns

function search(event) {
    const option = event.currentTarget
    const searchSelect = document.querySelector("select[name='search']")
    searchSelect.value = option.getAttribute("value")
    const searchGo = document.querySelector("input[name='Search']")
    searchGo.click()
}

function semester(event) {
    const option = event.currentTarget
    const semesterSelect = document.querySelector("select[name='semto']")
    semesterSelect.value = option.getAttribute("value")
    const semesterGo = document.querySelector("input[name='Semester']")
    semesterGo.click()
}

// main part of the user script
(function() {
    'use strict';
    console.log("This is betterUnivIS, starting up")
    window.addEventListener("load",runAllImprovements,false)
})();

// further ideas for the future:

// todo: replace Ancient HTML tags that are not supported any more (such as <font>)
// todo: optimize for both language options
// todo: optimize for mobile devices
// todo: remove navigation links that lead nowhere / contain no sub-links or directories / modules
// todo: sort by (options) with headers for each step
// todo: Filter (ects > x or something, hide exercises, ...)
// todo: show map next to room on details page or something
// todo: prettyfy the basic infotext of the modules - align dates vertically and so on
