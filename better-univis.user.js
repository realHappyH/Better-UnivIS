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

// page structure
// completeDoc = document.querySelector("table tbody")
// topHeaderWithLogo = completeDoc.children[0].children[0]
// topHeaderWithTimetable = completeDoc.children[1].children[0].children[0].children[0].children[0].children[1].children[0]
// topHeaderWithSearch = completeDoc.children[1].children[0].children[0].children[0].children[0].children[1].children[1].children[0].children[0].children[1].children[0].children[0].children[0]
// leftLinksInBody = completeDoc.children[3].children[0].children
// mainbody = completeDoc.children[3].children[1]

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
function menu() {
    // make button style
    const buttonStyle = `
    a.button {
    padding: 5px 6px;
    border: 1px outset buttonborder;
    border-radius: 3px;
    color: buttontext;
    background-color: buttonface;
    text-decoration: none;
}
    `
    var stylesheet = document.createElement("style")
    stylesheet.innerText = buttonStyle
    document.head.appendChild(stylesheet)

    // function to create a button that links to the link with name name
    function createLinkButton(link, name) {
        let button = document.createElement("a")
        button.setAttribute("href", link)
        button.innerText = name
        button.setAttribute("class", "button")
        return button
    }

    // navigate to the menu element. Caution: Only works after CAU Link has already been removed.
    completeDoc = document.querySelector("table tbody")
    topHeaderWithSearch = completeDoc.children[1].children[0].children[0].children[0].children[0].children[1].children[1].children[0].children[0].children[1].children[0].children[0].children[0]

    // get a list of the other "menus" (tables with links on the left)
    leftLinksInBody = completeDoc.children[3].children[0].children
    for (table of leftLinksInBody) {
        heading = table.children[0].children[2].children[0].children[0].textContent
    }
    // todo: implement

    // get the link for "Sammlung/stundenplan" and "Home/Kontakt/Hilfe/Sprache", remove the top bar, and add them to the menu
    topHeaderWithTimetable = completeDoc.children[1].children[0].children[0].children[0].children[0].children[1].children[0]
    // todo: restore language setting

    // create the new menu elements
    let home = document.createElement("td")
    let timetable = document.createElement("td")
    homefont = document.createElement("font")
    timetablefont = document.createElement("font")
    for (font of [homefont, timetablefont]) {
        font.setAttribute("color", "#000000")
        font.setAttribute("size", "2")
    }
    home.appendChild(homefont)
    timetable.appendChild(timetablefont)

    link = document.querySelector("input[name='done-anew/unihd-topnav:anew/unihd:DEFAULT'] ~ a").getAttribute('href')
    homebutton = createLinkButton(link, "🏠 Home")

    timetablelink = topHeaderWithTimetable.children[0].children[3].children[1].children[0].children[0].children[0].children[0].children[0].getAttribute("href")
    timetablebutton = createLinkButton(timetablelink, "📅 Sammlung")

    homefont.appendChild(homebutton)
    timetablefont.appendChild(timetablebutton)
    home.setAttribute('nowrap', '')
    timetable.setAttribute('nowrap', '')

    // process the already existing children
    allNewChildren = [home, timetable]
    for (child of topHeaderWithSearch.children) {
        child.removeAttribute('align')
        child.removeAttribute('valign')
        child.remove()
        allNewChildren.push(child)
    }

    // add all children to the menu
    for (child of allNewChildren) {
        topHeaderWithSearch.appendChild(child)
    }
    // at the end: remove the old black header
    topHeaderWithTimetable.remove()
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
function groupByECTS() {
    // todo: group small sub-exercises with their header exercise
    // find the main table
    const mainTable = document.querySelector("h2 ~ table")
    if (mainTable) {
        const bgcolor = "#eeeeee"
        const entries = mainTable.children[0].children
        const ectsAndModules = {};

        // go through each entry in the table, and add them to a dictionary corresponding to the nr. of ECTS
        let ects = "undefined"
        let previous = ects
        for (entry of entries) {
            const small = entry.querySelector("h4 ~ small")
            if (small) {
                const infotext = small.innerText
                // these are the two types of ways I've seen ECTS indicated in the text
                const i = infotext.indexOf("ECTS: ") // nr of ects after
                const j = infotext.indexOf("ECTS;") // two different possible ECTS numbers before, I take the second
                if (i > -1) {
                    ects = infotext.substring(i + 6, i + 7)
                } else if (j > -1) {
                    ects = infotext.substring(j - 3, j - 1)
                    ects = ects.trim()
                // if it is an exercise, I rely on the fact that the previous entry was the corresponding VL
                } else if (infotext.match("UE")){
                    ects = previous
                } else {
                    ects = "undefined"
                }
            } else {
                ects = "undefined"
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
            const heading = document.createElement("h3")
            heading.innerText = ects + " ECTS"
            mainTable.children[0].appendChild(heading)
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
    const logo = document.querySelectorAll("img[src='/img/anew/univis_96_20.gif']")
    for (instance of logo) {
        instance.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/logo.png")
    }
}

// runs all of the functions. caution: order important
// todo: refactor so that the order is no longer so important
function runAllImprovements() {
    changeFont()
    darkMode()
    countModules()
    removeCAULink()
    replaceCheckboxes()
    menu()
    prideLogo()
    groupByECTS()
}

// main part of the user script
(function() {
    'use strict';
    console.log("This is betterUnivIS, starting up")
    window.addEventListener("load",runAllImprovements,false)
})();

// todo: sort by (options) with headers for each step
// todo: Filter (ects > x or something, hide exercises, ...)
// todo: show map next to room on details page or something
// todo: add better menu
