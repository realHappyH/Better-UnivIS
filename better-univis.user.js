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


function changeFont() {
    let bodyElement = document.getElementsByTagName("body")
        if (bodyElement) {
        bodyElement = bodyElement[0]
        console.log("hello world")
        //change main font to Bahnschrift
        const styles = {
            fontFamily:'Bahnschrift, Helvetica, Sans Serif'
        }
        Object.assign(bodyElement.style, styles)

        // test element to see if script works
        let p = document.createElement("p")
        p.innerText = "GUTEN MORGEN HALLO WELT"
        bodyElement.append(p)
    }
}

function removeCAULink() {
    let cauElement = document.querySelector("td[bgcolor='#eeeeee'][width='148'][rowspan='2']")
    let bgElement = document.querySelector("td[colspan='1'][rowspan='2'][bgcolor='#003366'][width='1']")
    let sideElement = document.querySelector("table[width='100%'] tbody")
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

// todo does not work
function menu() {
    let home = document.createElement("td")
    let link = document.createElement("a")
    link.setAttribute("href", "youtube.com")
    home.appendChild(link)
    menutable = document.querySelectorAll("table")[8].children[0].children[0].appendChild(home)
}

// display a counter how many modules are in this category (WP inf)
function countModules() {
    mainTable = document.querySelector("table[border='0'][width='100%'][cellspacing='17'][cellpadding='0'] tbody")
    if(mainTable) {
        try {
            count = mainTable.children[1].children[0].children[3].children[0].children.length
            heading = mainTable.children[1].children[0].children[0]
            heading.innerText = heading.innerText + " ("+ count + " modules)"
        } catch {
            // we are not in a table with modules
            console.log("Main table not found")
        }
    }
}

// group modules by their ECTS
function groupByECTS() {
    // find the main table
    mainTable = document.querySelector("h2 ~ table")
    if (mainTable) {
        entries = mainTable.children[0].children
        var dict = {};

        // go through each entry in the table, and add them to a dictionary corresponding to the nr. of ECTS
        for (entry of entries) {
            small = entry.querySelector("h4 ~ small")
            if (small) {
                infotext = small.innerText
                // these are the two types of ways I've seen ECTS indicated in the text
                i = infotext.indexOf("ECTS: ") // nr of ects after
                j = infotext.indexOf("ECTS;") // two different possible ECTS numbers before, I take the second
                if (i > -1) {
                    ects = infotext.substring(i + 6, i + 7)
                    if(Object.hasOwn(dict, ects)) {
                        dict[ects].push(entry)
                    } else {
                        dict[ects] = [entry]
                    }
                } else if (j > -1) {
                    ects = infotext.substring(j - 3, j - 1)
                    ects = ects.trim()
                    if(Object.hasOwn(dict, ects)) {
                        dict[ects].push(entry)
                    } else {
                        dict[ects] = [entry]
                    }
                } else {
                    if(Object.hasOwn(dict, "undefined")) {
                        dict["undefined"].push(entry)
                    } else {
                        dict["undefined"] = [entry]
                    }
            }
            } else {
                if(Object.hasOwn(dict, "undefined")) {
                    dict["undefined"].push(entry)
                } else {
                    dict["undefined"] = [entry]
                }
            }
        }
        // add them again, with headings <h3> which ECTS it is
        console.log(dict)
        ectss = Object.keys(dict)
        console.log(ectss)
        ectss.sort()
        for (ects of ectss) {
            heading = document.createElement("h3")
            heading.innerText = ects + " ECTS"
            mainTable.children[0].appendChild(heading)
            for (entry of dict[ects]) {
                mainTable.children[0].appendChild(entry)
            }
        }
    }
}

// removes the useless checkboxes and replaces the useful but ugly ones with pretty ones
function replaceCheckboxes() {
    uselessCheckboxes = document.querySelectorAll("input[type='checkbox']")
    if (uselessCheckboxes) {
        for (checkbox of uselessCheckboxes) {
            checkbox.remove()
        }
    }
    uselessOptions1 = document.querySelectorAll("input[name='hinzufügen']")
    uselessOptions2 = document.querySelectorAll("input[name='löschen']")
    uselessOptions3 = document.querySelectorAll("input[name='einschränken']")

    if (uselessOptions1 && uselessOptions2 && uselessOptions3) {
        for (options of [uselessOptions1, uselessOptions2, uselessOptions3]) {
            for (option of options) {
                option.remove()
            }
        }
    }
    uglyCheckboxes_unchecked = document.querySelectorAll("input[type='image'][src='/img/anew/samm.gif']")
    if (uglyCheckboxes_unchecked) {
        for (checkbox of uglyCheckboxes_unchecked) {
            // checkbox.setAttribute("type", "checkbox")
            // checkbox.removeAttribute("src")
            checkbox.setAttribute("width", "30px")
            checkbox.setAttribute("height", "30px")
            // checkbox.removeAttribute("height")
            checkbox.setAttribute("src", "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.pngrepo.com%2Fpng%2F310639%2F512%2Fcheckbox-unchecked.png&f=1&nofb=1&ipt=3a01b0d8302f57889a8036d67b4c5674be1729c061a6ac6bef5a708fc7934721")
        }
    }
    uglyCheckboxes_checked = document.querySelectorAll("input[type='image'][src='/img/anew/samm_yes.gif']")
    if (uglyCheckboxes_checked) {
        for (checkbox of uglyCheckboxes_checked) {
            // checkbox.setAttribute("type", "checkbox")
            // checkbox.setAttribute("checked", "checked")
            //checkbox.removeAttribute("src")
            checkbox.setAttribute("width", '30px')
            checkbox.setAttribute("height", "30px")
            // checkbox.removeAttribute("height")
            checkbox.setAttribute("src", "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fclipart-library.com%2Fimages_k%2Fwhite-check-mark-transparent-background%2Fwhite-check-mark-transparent-background-20.png&f=1&nofb=1&ipt=0672ebe2bd12abd7f1fae8cd608c67bd19f88d7cf1592be3dab4e98bdf511777")
        }
    }
}

// uses Dark Reader to enable dark mode on the site
function darkMode() {
    DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10
        })
    }

function prideLogo() {
    logo = document.querySelectorAll("img[src='/img/anew/univis_96_20.gif']")
    for (instance of logo) {
        instance.setAttribute("src", "https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/logo.png")
    }
}

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

(function() {
    'use strict';
    console.log("TEST")
    window.addEventListener("load",runAllImprovements,false)
})();

// todo: sort by (options) with headers for each step
// todo: Filter (ects > x or something, hide exercises, ...)
// todo: show map next to room on details page or something
// todo: remove CAU main page link, add better menu
