const Autosave = {
  setUpAutosave: function(listData, recoveredFilename) {
    const trixElement = document.querySelector("trix-editor");
    const trixEditor = trixElement.editor;
    const tabID = Math.random() * 10e16;
    let updated = false;
    let autosaveTimeoutID;

    const autosave = function() {
      if (autosaveTimeoutID) {
        clearTimeout(autosaveTimeoutID);
      }

      autosaveTimeoutID = setTimeout(() => {
        // On first update, remove previous file from localStorage
        // so it can be replaced by new one
        if (updated === false && recoveredFilename) {
          localStorage.removeItem(recoveredFilename);
          updated = true;
        }
        const dateTime = new Date();
        const autosaveItem = {
          timestamp: dateTime.getTime(),
          date: dateTime.toLocaleDateString(),
          time: dateTime.toLocaleTimeString(),
          editorContent: trixEditor,
          headwordsAndInflections: {
            headwords: listData.headwords,
            inflections_map: listData.inflectionsMap,
          },
          assumedWords: listData.assumedWords,
          myListParsedLists: listData.myListParsedLists,
        };
        const filename = `autosave-${tabID}`;
        localStorage.setItem(filename, JSON.stringify(autosaveItem));
      }, 800);
    };

    return autosave;
  }
};


export { Autosave };
