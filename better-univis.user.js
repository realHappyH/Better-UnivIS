// ==UserScript==
// @name        Better UnivIS
// @namespace   Violentmonkey Scripts
// @match       *://univis.uni-kiel.de/*
// @grant       none
// @version     1.1.0
// @author      HappyH
// @description Verbessert UnivIS
// @require     https://unpkg.com/darkreader@4.9.105/darkreader.js#sha512=2b7f8f0cb074b0f1ca650f8feb81e345232a9f973257481dc0f56e8fcabb44f052e591f9039b684490c4e650bb71024f365fa085539a4213ad21bd7f15d28e93
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/url
// @run-at      document-body
// ==/UserScript==

/* global DarkReader, VM */

// handling page loading
const { onNavigate } = VM;

const CURRENT_VERSION = '1.1.0';

const mainStyle = `
a {
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
body {
    margin: 0;
}
`;

const settings = {
    countModules: {
        name: 'Count Modules',
        active: localStorage.getItem('countModules') === 'true',
        activate: () => {
            settings.countModules.active = true;
            localStorage.setItem('countModules', true);
            countModules();
        },
        deactivate: () => {
            settings.countModules.active = false;
            localStorage.setItem('countModules', false);
            location.reload();
        },
        listener: (event) => {
            if (event.target.checked) {
                settings.countModules.activate();
            } else {
                settings.countModules.deactivate();
            }
        },
    },
    groupByECTS: {
        name: 'Group Modules by ECTS',
        active: localStorage.getItem('groupByECTS') === 'true',
        activate: () => {
            settings.groupByECTS.active = true;
            localStorage.setItem('groupByECTS', true);
            groupByECTS();
        },
        deactivate: () => {
            settings.groupByECTS.active = false;
            localStorage.setItem('groupByECTS', false);
            location.reload();
        },
        listener: (event) => {
            if (event.target.checked) {
                settings.groupByECTS.activate();
            } else {
                settings.groupByECTS.deactivate();
            }
        },
    },
};

// helper functions

// get latest better-univis release
async function getLatestRelease() {
    return await fetch(
        'https://api.github.com/repos/realHappyH/better-univis/releases/latest',
    ).then((response) => response.json());
}

// zips two arrays into a single array of two-element arrays
function zip(arr1, arr2) {
    const result = [];
    for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
        result.push([arr1[i], arr2[i]]);
    }
    return result;
}

// adds the given style to the document head
function addCSS(css) {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = css;
    document.head.appendChild(stylesheet);
}

// returns true iff the language is set to german
function german() {
    return !!document.querySelector(`input[name='English']`);
}

// check if html element is empty
function isEmpty(element) {
    return !element.textContent.trim() && element.childElementCount == 0;
}

// get element by its image source
function getImgBySrc(src) {
    return document.querySelector(`img[src='${src}']`);
}

// functions that implement features

// change main font to Bahnschrift
function changeFont() {
    let bodyElement = document.getElementsByTagName('body');
    if (bodyElement) {
        bodyElement = bodyElement[0];

        const styles = {
            fontFamily: 'Bahnschrift, Helvetica, Sans Serif',
        };
        Object.assign(bodyElement.style, styles);
    }
}

// make main table prettier
function prettyTable() {
    // there is a table of modules iff there is a checked or unchecked checkbox element somewhere
    const tableEntry = document.querySelector(
        'input[src="https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg"], input[src="https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg"]',
    );
    if (tableEntry) {
        // locate table of modules and change its style
        const mainTable = tableEntry.closest('table');
        mainTable.setAttribute('cellspacing', '0');
        mainTable.setAttribute('cellpadding', '7');

        // make different table version for small screens
        let small = false;
        const replacements = {};
        const entries = mainTable.children[0].children;
        // copy the old elements to be able to switch between the elements for small and big screens
        for (let i = 0; i < entries.length; i++) {
            const largeEntry = entries[i].cloneNode(true);
            const smallEntry = entries[i].cloneNode(true);

            // remove all empty tags to save space
            for (const child of smallEntry.children) {
                if (isEmpty(child)) {
                    child.remove();
                }
            }

            const sNumberData = smallEntry.children[1];
            const sContent = smallEntry.children[2];
            const sLecturers =
                smallEntry.children[smallEntry.children.length - 1];
            const lecturerText = document.createElement('small');
            if (sContent) {
                const number = sNumberData.innerText;
                const heading = sContent.querySelector('h4');
                if (heading && number.length > 3) {
                    heading.innerHTML =
                        heading.innerHTML += ` (${number.trim()})`;
                    sNumberData.remove();
                }
                if (sLecturers) {
                    sLecturers.remove();
                    const lecturerLinks = sLecturers.querySelectorAll('a');

                    for (let i = 0; i < lecturerLinks.length; i++) {
                        const link = lecturerLinks[i];
                        lecturerText.appendChild(link);
                        if (i < lecturerLinks.length - 1) {
                            lecturerText.innerHTML += ', ';
                        }
                    }
                    sContent.prepend(lecturerText);
                }
            }
            replacements[i] = {
                large: largeEntry,
                small: smallEntry,
            };
        }
        // change tables for small screens
        window.addEventListener('resize', () => {
            // small window size
            if (window.innerWidth < 600) {
                // was previously not small
                if (small == false) {
                    mainTable.setAttribute('cellpadding', '1');
                    small = true;
                    for (let i = 0; i < entries.length; i++) {
                        entries[i].replaceWith(replacements[i].small);
                    }
                }
            } else {
                if (small == true) {
                    mainTable.setAttribute('cellpadding', '7');
                    small = false;
                    for (let i = 0; i < entries.length; i++) {
                        entries[i].replaceWith(replacements[i].large);
                    }
                }
            }
        });
    }
}

// make main page look better on mobile
function prettyMainPage() {
    addCSS(`
.collapsible {
  background-color: #eee;
  color: #444;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 15px;
}

.active, .collapsible:hover {
  background-color: #dddddd;
}

.collapsible-content {
  padding: 18px;
  display: none;
  overflow: hidden;
  background-color: #fefefe;
}

.collapsible:after {
  content: '+';
  font-size: 13px;
  color: black;
  float: right;
  margin-left: 5px;
}

.active:after {
  content: "-";
}

div.main-page {
    padding: 10px;

}
    `);
    // we are on the main page iff we find the heading "Education" or "Lehre"
    const xpath = "//b[text()='Lehre'] | //b[text()='Education']";
    const mainPageElem = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
    ).singleNodeValue;
    // get the elements from the main page to be able to work with them
    if (mainPageElem) {
        const mainLayout = mainPageElem
            .closest('table')
            .parentElement.closest('table').parentElement.parentElement;
        const tableWrapper = mainLayout.children;
        const tables = Array.from(tableWrapper[0].children)
            .concat(Array.from(tableWrapper[1].children))
            .filter((elem) => elem.innerText.trim())
            .map((elem) => elem.querySelector('table').children[0]);
        const mainPage = mainLayout.parentElement;
        mainLayout.remove();
        // replace the old elements with new ones
        for (const table of tables) {
            const title = table.querySelector('b').innerText;
            const linkList = table.querySelectorAll('a');

            const collapsibleButton = document.createElement('div');
            collapsibleButton.innerText = title;
            collapsibleButton.className = 'collapsible';

            const collapsibleContent = document.createElement('div');
            collapsibleContent.className = 'collapsible-content';
            for (const link of linkList) {
                const linkdiv = document.createElement('div');
                linkdiv.className = 'main-page';
                linkdiv.appendChild(link);
                collapsibleContent.appendChild(linkdiv);
            }
            // Lehre/Education is expanded by default
            if (title === 'Lehre' || title === 'Education') {
                collapsibleButton.classList.add('active');
                collapsibleContent.style.display = 'block';
            }
            // functionality to collapse/expand
            collapsibleButton.addEventListener('click', () => {
                collapsibleButton.classList.toggle('active');
                if (collapsibleContent.style.display === 'block') {
                    collapsibleContent.style.display = 'none';
                } else {
                    collapsibleContent.style.display = 'block';
                }
            });
            mainPage.appendChild(collapsibleButton);
            mainPage.appendChild(collapsibleContent);
        }
    }
}

// change the menu to be in a coherent style
function menu() {
    // style for different menu elements
    addCSS(`
.pride-logo {
    max-height: 50px;
    width: 10%;
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
}

.nav-right:hover {
    background-color: #dddddd;
    cursor: pointer;
}

.nav-right#mode, .nav-right#settingsBtn {
    height: 40px;
    padding: 5px;
    width: 3%;
    display: flex;
    justify-content: center;
}

.nav-right#mode img {
    height: 40px;
    margin: auto;
}

.nav-right#language {
    width: 3%;
    padding-left: 0;
    padding-right: 0;
    display: flex;
    justify-content:center;
}

.nav-right#language input {
    margin: auto;
    padding: 15px;
    height: 20px;
    width: 33px;
}

#oldsemester {
    display: none;
}

#oldsearch {
    display: none;
}

.navbar img {
    float: left;
    height: 40px;
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

.dropdown-content a:hover, .dropdown-content div:hover {
    background-color: #ddd;
}

.dropdown:hover .dropdown-content {
    display: block;
}

/* responsive menu for small screens */

.navbar .icon {
    display: none;
}

@media screen and (max-width: 1200px) {
    .pride-logo {
        width: auto;
    }
    .navbar .nav-link, .navbar .dropdown, .navbar .nav-right#mode, .navbar .nav-right#settingsBtn img, .navbar .nav-right#language {
        display: none;
    }
    .navbar .notification.visible {
        display: block;
        position: absolute;
    }
    .navbar a.icon {
        float: right;
        display: block;
        padding: 5px;
    }
    .navbar.responsive {
        position: relative;
    }
    .navbar.responsive a.icon {
        position: absolute;
        right: 0;
        top: 0;
    }
    .navbar.responsive .nav-link, .navbar.responsive .dropdown, .navbar.responsive .nav-right#mode, .navbar.responsive .nav-right#settingsBtn img, .nav-right#settingsBtn, .navbar.responsive .nav-right#language, navbar.responsive .pride-logo, .navbar.responsive img {
        float: none;
        display: block;
        text-align: center;
        width: auto;
        margin: auto;
    }
    .navbar.responsive .notification {
        position: relative;
        width: 10px;
        top: -50px;
        right: -51%;
    }
}
    `);

    // constant to hold all menu elements with their links that exist
    const menuElems = {};

    // Elements of the black top header

    // get sammlung/stundenplan link
    const sammlungImg = getImgBySrc('/img/anew/samm_inv.gif');
    if (sammlungImg) {
        const sammlungLink = (menuElems.sammlung =
            sammlungImg.parentElement.getAttribute('href'));
        if (german()) {
            menuElems.sammlung = [sammlungLink, '📅 Sammlung'];
        } else {
            menuElems.sammlung = [sammlungLink, '📅 Collection'];
        }
    }

    // get Home link
    var xpath = "//b[text()='Home']";
    const homeText = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
    ).singleNodeValue;
    if (homeText) {
        const HomeLink =
            homeText.parentElement.parentElement.getAttribute('href');
        menuElems.home = [HomeLink, '🏠 Home'];
    }

    // get Language link
    const languageSelector = document.querySelector(
        "input[name='English'], input[name='German']",
    );
    if (languageSelector) {
        // change the image
        if (languageSelector.getAttribute('name') == 'English') {
            languageSelector.setAttribute(
                'src',
                'https://upload.wikimedia.org/wikipedia/commons/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg',
            );
        } else {
            languageSelector.setAttribute(
                'src',
                'https://upload.wikimedia.org/wikipedia/commons/b/ba/Flag_of_Germany.svg',
            );
        }
        // get the hidden input as well
        const languageHiddenInput = document.querySelector(
            "input[type='hidden'][name='submitimg-English'], input[type='hidden'][name='submitimg-German']",
        );
        menuElems.language = [
            [languageSelector, languageHiddenInput],
            '🌐 Sprache',
        ];
    }

    // Elements of the lower top header

    // get Search-element
    const searchSelect = document.querySelector("select[name='search']");
    if (searchSelect) {
        if (german()) {
            menuElems.search = [
                searchSelect.parentElement.parentElement,
                '🔎 Suche',
            ];
        } else {
            menuElems.search = [
                searchSelect.parentElement.parentElement,
                '🔎 Search',
            ];
        }
    }

    // get Semester-select-element
    const semesterSelect = document.querySelector("select[name='semto']");
    if (semesterSelect) {
        menuElems.semester = [
            semesterSelect.parentElement.parentElement,
            '🏫 Semester',
        ];
    }

    // Side elements (differ from page to page)

    const sideMenuElem = document.querySelector(
        "td[width='150'][valign='top'][height='100%'][bgcolor='#ffffff']",
    );
    const sideMenu = {};
    if (sideMenuElem) {
        var previous = 'undefined';

        // go through all tables that exist in this side menu - they contain the menu elements
        for (const sideMenuTable of sideMenuElem.children) {
            const headingElem = sideMenuTable.querySelector('b');
            const sideElemLinks = sideMenuTable.querySelectorAll('a');
            if (headingElem) {
                const heading = headingElem.innerText;
                previous = heading;
                sideMenu[heading] = sideElemLinks;
            } else {
                // if the heading doesn't exist, then the table probably belongs under the previous table's heading
                // if not, then they are under "Undefined"
                if (Object.hasOwn(sideMenu, previous)) {
                    sideMenu[previous].push.apply(
                        sideMenu[previous],
                        sideElemLinks,
                    );
                } else {
                    sideMenu[previous] = sideElemLinks;
                }
            }
        }

        // remove the side element and reposition the central element
        const mainElem = sideMenuElem.nextElementSibling;
        sideMenuElem.innerHTML = '';
        sideMenuElem.setAttribute('width', '10%');
        mainElem.children[0].setAttribute('width', '90%');
    }

    // create the new nav bar in all cases
    const newMenu = document.createElement('nav');
    newMenu.setAttribute('class', 'navbar');
    const navDiv = document.createElement('div');
    navDiv.setAttribute('class', 'nav-container');
    const navPlaceholder = document.createElement('div');
    navPlaceholder.setAttribute('class', 'nav-placeholder');
    newMenu.appendChild(navDiv);

    // add the pride logo to the navbar
    const logo = document.createElement('img');
    logo.setAttribute('class', 'pride-logo');
    logo.setAttribute(
        'src',
        'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/logo.svg',
    );
    logo.setAttribute('alt', 'UnivIS');
    if (german()) {
        logo.setAttribute('title', 'Informationssystem der Universität Kiel');
    } else {
        logo.setAttribute('title', 'Information system of Kiel University');
    }
    navDiv.appendChild(logo);

    // add all elements to the menu

    // add Home and Sammlung links, if they exist
    for (const element of ['home', 'sammlung']) {
        if (element in menuElems) {
            const menuItem = document.createElement('a');
            menuItem.setAttribute('href', menuElems[element][0]);
            menuItem.setAttribute('class', 'nav-link');
            menuItem.innerText = menuElems[element][1];

            navDiv.appendChild(menuItem);
        }
    }

    // add the search and semester options in new style

    for (const element of ['search', 'semester']) {
        if (element in menuElems) {
            const dropdownElem = document.createElement('div');
            dropdownElem.setAttribute('class', 'dropdown');

            const dropdownButton = document.createElement('div');
            dropdownButton.setAttribute('class', 'dropbtn');
            dropdownButton.innerText = menuElems[element][1];

            // display current semester in semester dropdown
            if (element == 'semester') {
                dropdownButton.innerText = `${dropdownButton.innerText}: ${semesterSelect.value}`;
            }

            const dropdownContent = document.createElement('div');
            dropdownContent.setAttribute('class', 'dropdown-content');

            const old = menuElems[element][0];
            const options = old.children[0].children[0].children;

            // add the options to the dropdown
            for (const option of options) {
                const selectOption = document.createElement('div');
                selectOption.innerText = option.innerText;
                selectOption.setAttribute(
                    'value',
                    option.getAttribute('value'),
                );

                // add corresponding event listeners
                if (element == 'search') {
                    selectOption.addEventListener('click', search);
                } else {
                    selectOption.addEventListener('click', semester);
                }
                dropdownContent.appendChild(selectOption);
            }
            dropdownElem.appendChild(dropdownButton);
            dropdownElem.appendChild(dropdownContent);
            navDiv.appendChild(dropdownElem);

            // hide old options (css)
            const hidden = document.createElement('div');
            hidden.setAttribute('id', `old${element}`);
            hidden.appendChild(old);
            navDiv.appendChild(hidden);
        }
    }

    // add the elements from the side menu

    for (const heading of Object.keys(sideMenu)) {
        // create a dropdown menu that has all the links under the current heading
        const dropdownElem = document.createElement('div');
        dropdownElem.setAttribute('class', 'dropdown');

        const dropdownButton = document.createElement('div');
        dropdownButton.setAttribute('class', 'dropbtn');
        dropdownButton.innerText = heading;

        const dropdownContent = document.createElement('div');
        dropdownContent.setAttribute('class', 'dropdown-content');

        for (const link of sideMenu[heading]) {
            dropdownContent.appendChild(link);
        }

        dropdownElem.appendChild(dropdownButton);
        dropdownElem.appendChild(dropdownContent);

        navDiv.appendChild(dropdownElem);
    }

    // add expansion button for small screens

    function expandMenu() {
        if (newMenu.className === 'navbar') {
            newMenu.className += ' responsive';
        } else {
            newMenu.className = 'navbar';
        }
    }

    const hamburgerLink = document.createElement('a');
    hamburgerLink.href = 'javascript:void(0)';
    hamburgerLink.className = 'icon';
    hamburgerLink.addEventListener('click', expandMenu);
    const hamburgerIcon = document.createElement('img');
    hamburgerIcon.src =
        'https://upload.wikimedia.org/wikipedia/commons/b/b2/Hamburger_icon.svg';
    if (DarkReader.isEnabled()) {
        hamburgerIcon.style = 'filter:invert(93%)';
    }
    hamburgerLink.appendChild(hamburgerIcon);
    navDiv.appendChild(hamburgerLink);

    // Elements on the right side of the navbar

    // add a settings menu

    // button for opening the settings menu
    const settingsBtn = document.createElement('div');
    settingsBtn.setAttribute('class', 'btn nav-right');
    settingsBtn.id = 'settingsBtn';
    const settingsImg = document.createElement('img');
    settingsImg.src =
        'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/cogs.svg';
    if (DarkReader.isEnabled()) {
        settingsImg.setAttribute('style', 'filter:invert(93%)');
    }
    settingsBtn.appendChild(settingsImg);

    // append to menu
    navDiv.append(settingsBtn);

    // create settings modal
    addCSS(`
#settings_checkboxes label {
    float: left;
}
.settingsList {
    margin: 5;
    list-style: none;
    float: left;
}
#settings_checkboxes input {
    margin-left: 10px;
}
.settings label {
    float: left;
}
.settings ul {
    margin: 0;
    list-style: none;
    float: left;
}
#update-button {
    background-color: #ddd;
    border-radius: 8px;
    color: green;
}
#update-button:hover {
    background-color: #bbb;
}
.close-button {
    float: right;
    padding: 5px;
    padding-left: 9px;
    padding-right: 9px;
    border-radius: 8px;
}
.close-button:hover {
    background-color: #dddddd;
    cursor: pointer;
}
.notification {
    background-color: #fa3e3e;
    border-radius: 4px;
    padding: 5px;
    position: absolute;
    top:2px;
    right:8px;
    display: none;
}
.notification.visible {
    display: block;
}
    `);
    const modal = document.createElement('dialog');
    navDiv.append(modal);

    // open the settings modal when the settings button is clicked
    settingsBtn.addEventListener('click', () => {
        modal.showModal();
    });
    modal.id = 'settingsMenu';
    const closeButton = document.createElement('div');
    closeButton.innerText = '✖';
    closeButton.className = 'close-button';
    closeButton.addEventListener('click', () => {
        modal.close();
    });
    const settingsHeader = document.createElement('h3');
    settingsHeader.innerText = 'Better UnivIS Settings';
    modal.appendChild(closeButton);
    modal.appendChild(settingsHeader);

    // Version info

    // show notification iff new Update is available
    const notification = document.createElement('span');
    notification.className = 'notification';
    notification.innerText = '1';

    getLatestRelease().then((response) => {
        const latestVersion = response.tag_name;
        console.log(`latest version: ${latestVersion}`);

        const newVersionAvailable = zip(
            latestVersion.split('.').map((elem) => {
                return Number(elem.replace('v', ''));
            }),
            CURRENT_VERSION.split('.').map((elem) => {
                return Number(elem);
            }),
        ).reduce((acc, cur) => acc || cur[0] > cur[1], false);

        settingsBtn.appendChild(notification);

        console.log(`new version available: ${newVersionAvailable}`);

        // add version info to settings menu
        const vDiv = document.createElement('div');
        vDiv.className = 'settings';
        const versionLabel = document.createElement('label');
        versionLabel.innerText = 'Better UnivIS Version';
        vDiv.appendChild(versionLabel);
        const versionList = document.createElement('ul');
        const current = document.createElement('li');
        current.innerText = `installed: v${CURRENT_VERSION}`;
        const recent = document.createElement('li');
        recent.innerText = `latest: ${latestVersion}`;
        versionList.append(current, recent);
        versionList.className = 'settingsList';

        // show update button if new version available
        if (newVersionAvailable) {
            notification.classList.add('visible');
            const updateEntry = document.createElement('li');
            const updateButton = document.createElement('a');
            updateButton.innerText = 'Update';
            updateButton.id = 'update-button';
            updateButton.href = response.assets[0].browser_download_url;
            updateEntry.appendChild(updateButton);
            versionList.append(updateEntry);
        }

        vDiv.append(versionList);
        modal.appendChild(vDiv);
    });

    const settingsDiv = document.createElement('div');
    settingsDiv.id = 'settings_checkboxes';
    const settingsLabel = document.createElement('label');
    settingsLabel.innerText = 'Experimental Settings';
    settingsDiv.appendChild(settingsLabel);
    const settingsList = document.createElement('ul');
    settingsList.className = 'settingsList';

    // add the settings to the settings modal
    for (const setting of Object.values(settings)) {
        const countSetting = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.addEventListener('change', setting.listener);
        checkbox.type = 'checkbox';
        if (setting.active) {
            checkbox.setAttribute('checked', '');
        } else {
            checkbox.removeAttribute('checked');
        }
        countSetting.innerText = setting.name;
        countSetting.appendChild(checkbox);
        settingsList.appendChild(countSetting);
    }
    settingsDiv.append(settingsList);
    modal.appendChild(settingsDiv);

    // add the language option

    if (menuElems.language) {
        const div = document.createElement('div');
        div.setAttribute('class', 'nav-right');
        div.setAttribute('id', 'language');
        for (const item of menuElems.language[0]) {
            div.appendChild(item);
        }
        navDiv.appendChild(div);
    }

    // add light mode/dark mode option
    const lightdiv = document.createElement('div');
    lightdiv.setAttribute('class', 'nav-right');
    lightdiv.setAttribute('id', 'mode');
    const lightbutton = document.createElement('img');
    lightbutton.setAttribute(
        'src',
        'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/darkmode.svg',
    );
    if (DarkReader.isEnabled()) {
        lightbutton.setAttribute('style', 'filter:invert(93%)');
    }
    lightdiv.appendChild(lightbutton);
    navDiv.appendChild(lightdiv);
    lightdiv.addEventListener('click', toggleMode);

    // append the new menu to the top of the document
    const mainForm = document.body.querySelector('form');
    if (mainForm) {
        mainForm.prepend(navPlaceholder);
        mainForm.prepend(newMenu);
    }

    // delete the now unnecessary elements, if they exist
    const mainTable = document.body.querySelector('table tbody');
    if (mainTable) {
        let tableHTML = mainTable.innerHTML;
        let end = tableHTML.indexOf('<!-- END of unihd -->');
        let toDelete = tableHTML.substring(0, end);
        tableHTML = tableHTML.replace(toDelete, '');
        mainTable.innerHTML = tableHTML;
    }
}

// Display a counter how many modules are in this category (WP inf) (WIP)
function countModules() {
    const moduleTableElement = document.querySelector(
        "tbody tr[valign='top'][bgcolor='#eeeeee']",
    );
    if (moduleTableElement) {
        const modules = moduleTableElement.parentElement.children;
        let count = 0;
        for (const mod of modules) {
            // count everything except Exercises
            if (mod.innerText.match(/\sV;|\sS;|\sPRUE/)) {
                count++;
            }
        }
        const heading = document.querySelector('h2');
        if (heading) {
            heading.innerText = `${heading.innerText} (${count} modules)`;
        }
    }
}

// group modules by their ECTS
function groupByECTS() {
    // find the main table
    const mainTable = document.querySelector('h2 ~ table');
    if (mainTable) {
        const bgcolor = '#eeeeee';
        const entries = mainTable.children[0].children;
        const ectsAndModules = {};

        // go through each entry in the table, and add them to a dictionary corresponding to the nr. of ECTS
        let ects = 'undefined';
        let previous = ects;
        for (const entry of entries) {
            const small = entry.querySelector('h4 ~ small');
            if (small) {
                const infotext = small.innerText;

                // these are the two types of ways I've seen ECTS indicated in the text:
                const i = infotext.indexOf('ECTS: '); // nr of ects after
                const j = Math.max(
                    infotext.indexOf('ECTS;'), // two different possible ECTS numbers before, I take the second
                    infotext.indexOf('ETC;'), // same, but sometimes the S is not included for some reason
                    infotext.indexOf('ECTS,'), // occasionally comma instead of semicolon
                );
                if (i > -1) {
                    ects = infotext.substring(i + 6, i + 8);
                    if (ects[1] == ';') {
                        ects = ects[0];
                    }
                } else if (j > -1) {
                    ects = infotext.substring(j - 3, j - 1);
                    ects = ects.trim();

                    // if it is an exercise, I rely on the fact that the previous entry was the corresponding VL.
                } else if (!infotext.match('V;')) {
                    ects = previous;
                } else {
                    ects = 'undefined';
                }
            } else {
                // the small exercise options for different dates for Math modules land here
                ects = previous;
            }
            if (Object.hasOwn(ectsAndModules, ects)) {
                ectsAndModules[ects].push(entry);
            } else {
                ectsAndModules[ects] = [entry];
            }
            previous = ects;
        }

        // add them again, with headings <h3> which ECTS it is
        let hasColor = false;
        let ectss = Object.keys(ectsAndModules);
        ectss.sort();
        for (ects of ectss) {
            const headingrow = document.createElement('tr');
            const headingcol = document.createElement('td');
            const heading = document.createElement('h3');
            headingrow.setAttribute('valign', 'top');
            headingcol.setAttribute('colspan', '4');
            heading.innerText = ects + ' ECTS';
            headingrow.appendChild(headingcol);
            headingcol.appendChild(heading);
            mainTable.children[0].appendChild(headingrow);
            for (const entry of ectsAndModules[ects]) {
                const small = entry.querySelector('h4 ~ small');
                if (small) {
                    if (!small.innerText.match('UE')) {
                        hasColor = !(hasColor && true);
                    }
                }
                if (hasColor) {
                    entry.setAttribute('bgcolor', bgcolor);
                } else {
                    entry.removeAttribute('bgcolor');
                }
                mainTable.children[0].appendChild(entry);
            }
        }
    }
}

// removes the useless checkboxes and replaces the useful but ugly ones with pretty ones
function replaceCheckboxes() {
    // remove the useless checkboxes
    const uselessCheckboxes = document.querySelectorAll(
        "input[type='checkbox']",
    );
    if (uselessCheckboxes) {
        for (const checkbox of uselessCheckboxes) {
            checkbox.remove();
        }
    }

    // remove the useless "Auswahl hinzufügen" options
    const optionNames = ['hinzufügen', 'löschen', 'einschränken', 'anzeigen'];
    const uselessOptions = optionNames.map((name) =>
        document.querySelectorAll(`input[name='${name}']`),
    );

    for (const options of uselessOptions) {
        for (const option of options) {
            option.remove();
        }
    }

    // replace the ugly checkbox images with better images
    const checkboxNames = ['samm', 'samm_yes'];
    const uglyCheckboxes = checkboxNames.map((name) => [
        name,
        document.querySelectorAll(
            `input[type='image'][src='/img/anew/${name}.gif']`,
        ),
    ]);
    const darkStyle = 'filter:invert(93%)';
    for (const [checkboxName, checkboxes] of uglyCheckboxes) {
        for (const checkbox of checkboxes) {
            checkbox.setAttribute('width', '30px');
            checkbox.setAttribute('height', '30px');
            if (DarkReader.isEnabled()) {
                checkbox.setAttribute('style', darkStyle);
            }
            if (checkboxName == 'samm') {
                checkbox.setAttribute(
                    'src',
                    'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg',
                );
            } else {
                checkbox.setAttribute(
                    'src',
                    'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg',
                );
            }
        }
    }

    // replace the ugly checkboxes from the timetable view
    const timetableCheckboxNames = ['checkb', 'checkb_s'];
    const timetableCheckboxes = timetableCheckboxNames.map((name) => [
        name,
        document.querySelectorAll(`img[src='/img/anew/${name}.gif']`),
    ]);
    for (const [checkboxName, checkboxes] of timetableCheckboxes) {
        for (const checkbox of checkboxes) {
            checkbox.setAttribute('width', '20px');
            checkbox.setAttribute('height', '20px');
            checkbox.removeAttribute('align');
            if (DarkReader.isEnabled()) {
                checkbox.setAttribute(
                    'style',
                    `${darkStyle}; vertical-align:middle`,
                );
            }
            if (checkboxName == 'checkb') {
                checkbox.setAttribute(
                    'src',
                    'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-unchecked.svg',
                );
            } else {
                checkbox.setAttribute(
                    'src',
                    'https://raw.githubusercontent.com/realHappyH/Better-UnivIS/refs/heads/main/assets/checkbox-checked.svg',
                );
            }
        }
    }
}

// uses Dark Reader to enable dark mode on the site
function toggleMode() {
    const currentTheme = document.body.className;
    if (currentTheme == 'dark') {
        document.body.className = 'light';
        DarkReader.disable();
    } else {
        document.body.className = 'dark';
        DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10,
        });
    }
    localStorage.setItem('theme', document.body.className);
    location.reload();
}

// improves the list of links to look a little less overwhelming
function prettierList() {
    const Style = `
ul:not(.settingsList) {
    list-style-type: none;
    -moz-column-count: 4;
    -moz-column-gap: 20px;
    -webkit-column-count: 4;
    -webkit-column-gap: 20px;
    column-count: 4;
    column-gap: 20px;
}
@media screen and (max-width: 1200px) {
    ul:not(.settingsList) {
        column-count: 3;
        -webkit-column-count: 3;
        -moz-column-count: 3;
    }
}
@media screen and (max-width: 900px) {
    ul:not(.settingsList) {
        column-count: 2;
        -webkit-column-count: 2;
        -moz-column-count: 2;
    }
}
@media screen and (max-width: 500px) {
    ul:not(.settingsList) {
        column-count: 1;
        -webkit-column-count: 1;
        -moz-column-count: 1;
    }
}
ul:not(.settingsList) li {
    width: 100%;
}
ul:not(.settingsList) a {
    display: inline-block;
    text-decoration: none;
    padding:10px;
    width: 100%;
}
ul:not(.settingsList) a:hover {
    background-color: #ddd;
    text-decoration: none;
}
ul:not(.settingsList) a .alternate {
    background-color: #eeeeee;
}
    `;
    const stylesheet = document.createElement('style');
    stylesheet.innerText = Style;

    // look for certain <input> tags that only exist on pages where we don't want the new style
    const dont_style = ['pers', 'lvs', 'rooms'];
    const check = dont_style
        .map((name) => document.querySelector(`input[name='${name}']`))
        .reduce((acc, cur) => acc || cur);
    if (!check) {
        document.head.appendChild(stylesheet);
    }
}

// adds a meta tag such that the website looks better on mobile devices
function responsiveWebdesign() {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    document.head.appendChild(meta);
}

// runs all of the functions. caution: order important
function runAllImprovements() {
    addCSS(mainStyle);
    responsiveWebdesign();
    changeFont();
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.className = theme;
    if (theme == 'dark') {
        DarkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10,
        });
    }
    if (settings.countModules.active) {
        countModules();
    }
    replaceCheckboxes();
    menu();
    prettierList();
    prettyTable();
    prettyMainPage();
    if (settings.groupByECTS.active) {
        groupByECTS();
    }
}

// functionality of the new search and semester dropdown menus

function search(event) {
    const option = event.currentTarget;
    const searchSelect = document.querySelector("select[name='search']");
    searchSelect.value = option.getAttribute('value');
    const searchGo = document.querySelector("input[name='Search']");
    searchGo.click();
}

function semester(event) {
    const option = event.currentTarget;
    const semesterSelect = document.querySelector("select[name='semto']");
    semesterSelect.value = option.getAttribute('value');
    const semesterGo = document.querySelector("input[name='Semester']");
    semesterGo.click();
}

// main part of the user script
(function () {
    'use strict';
    console.log('This is betterUnivIS, starting up');
    onNavigate(runAllImprovements);
    runAllImprovements();
    //window.addEventListener('load', runAllImprovements, false);
})();
