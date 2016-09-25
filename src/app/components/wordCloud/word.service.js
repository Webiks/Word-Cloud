/**
 * Created by Harel on 08/06/2016.
 */

export class wordService {

  constructor($q, $http) {
    'ngInject';

    this.$q = $q;

    this.http = $http;

    this.selectionMode = '';

    this.hoveredMode = '';



    this.fontMin = 12, this.fontMax = 32;

  }

  // get delimiters from config file
  getConfig(configPath,configParams) {
    var defer = this.$q.defer();
    if (angular.isUndefined(configParams)) {
      configPath = (angular.isDefined(configPath)) ? configPath :this.getCurrentDirectory() ;
      this.http.get(configPath + 'wbxCloudConfig.json')
        .then(
          function (response) {
            defer.resolve(response.data);
          },

          function(response) { // Error callback
            defer.resolve("Error"); // Reject
          }
        );
    } else {
      return configParams;
    }

    return defer.promise;

  }




  setText(data, append, selectedWords) {

    function handleTextData(config) {
      var parsedData = that.wordService.dataToWordsArr(config.delimiters, that.text); // get the delimiters
      parsedData = that.wordService.spliceMaxWords( parsedData, config.maxWords);
      that.initCloud(parsedData, selectedWords);
      that.runListeners('updateData', parsedData);

    }

    // append data to this.text
    if (append && (this.text != null && this.text != "") && (angular.isDefined(data))) {
      this.text=this.text.concat(data);
    }
    else {
      this.text = data;
    }
    let that = this;

    that.wordService.$q.when(that.wordService.getConfig(this.config.configUrl,this.config.configParams)).then(handleTextData);
  }

  setListener(eventName, callback) {
    function unHookEvent() {
      this.events.splice(this.index, 1);
      this.events = null;
      this.index = null;
    }

    if (angular.isUndefined(this.events)) {
      this.events = {};
    }

    if (angular.isUndefined(this.events[eventName])) {
      this.events[eventName] = [];
    }

    return unHookEvent.bind({events: this.events[eventName], index: this.events[eventName].push(callback) - 1});
  }

// Bellow 2 function relate to API

  onSelect(allWords, selectedWordId) {

    var that = this, words = allWords,
      theWord = words[selectedWordId].text;

    if (window.event.ctrlKey) {
      _.forEach(words, function (w) {
        if (theWord === w.text ) {
          if( w.selected)
            d3.select('#p'+w.id).classed("selected", true);
          else
            d3.select('#p'+w.id).classed("selected", false);
        }
        else {
          var flag = theWord == w.text ? true : w.selected;
          d3.select('#p'+w.id).classed("selected", flag);
        }
      });
    } else {
      _.forEach(words, function (w) {
        if (w.text == theWord && w.selected) {
          d3.select('#p'+w.id).classed("selected", true);
          that.selectionMode = true;
        }
        else {
          d3.select('#p'+w.id).classed("selected", false);
        }
      });
    }
    //Now if any word still selected apply the selection class even after deselect event
    var selectionMode = [];
    for (var i = 0; i < words.length; i++) {
      if (words[i].selected) {
        selectionMode.push("selected");
      }
    }
    d3.select(this.elem).classed("selection-mode", selectionMode.length > 0);
  }

  onHover(allWords, hoveredWordId) {
    // we want to hover/unhover the allWords[hoveredWordId]
    //so to find full correlation and regardless the order in DOM we need to correlate between Id and Dom element
    //
    d3.select('#p'+hoveredWordId).classed("hovered",allWords[hoveredWordId].hovered);
    d3.select(this.elem).classed("hover-mode", (allWords[hoveredWordId].hovered))
  }

  runListeners(eventName, data,arr) {
    if (angular.isUndefined(this.events) || angular.isUndefined(this.events[eventName])) {
      return;
    }

    _.forEach(this.events[eventName], function (event) {
      event(data,arr);

    });
  }

  /**
   * @description parse the data:
   *              1) Gets delimiters and parse it to regex
   *              2) Use the regex delimiters to push each word into matchedWords array
   *              3) For each word in matchedWords push it into stats array ,
   *                and define the correspond id, size(frequency),
   *                children (identical words in matchedWords by index).
   *              4) Do wordService.data=stats and return stats
   * @param delimiters
   * @param newData
   * @returns {Array}
   */

  setDelimiters(delimiters) {
    var t = "", pattern;
    if (angular.isDefined(delimiters)) {

      let delimitersArr = delimiters.join('');
      pattern = new RegExp('[\\s'+ delimitersArr +']+');







    } else pattern=99; // 99 --> no delimiter , will be handle in setMatchWords()

    return pattern;
  };

  setMatchWords(text, pattern) {
    this.matchedWords = [];
    if (pattern == 99) { //no delimiters - use all the delimiters to delimiter
      pattern=(/([A-Z]||[a-z])\w+/g);
    }
    if( text.constructor.name=="String"){
      let splitedWords = text.split( pattern);
      _.remove(splitedWords, function(word){
        return word == "";
      });
      this.matchedWords.push(splitedWords); // takes each word from text and put them into elements in array
    }
    else   if( text.constructor.name=="Array") {
      for (var i = 0; i < text.length; i++) {
        let splitedWords = text[i].toString().split( pattern);
        _.remove(splitedWords, function(word){
          return word == "";
        });
        this.matchedWords.push(splitedWords);//.match(pattern)); // takes each word from text and put them into elements in array
      }
    }
    return this.matchedWords
  };

  setStats(matchedWords) {
    var stats = [], wordId = -1;
    matchedWords.forEach(function (word, index) {
      if(angular.isDefined(word) &&(word!=null)){
        word.forEach(function (elm) {
          var obj = _.find(stats, {text: elm});
          if (obj != undefined) {//if word already exist, increase its size and push it occurrence in the array (children)
            obj.size += 1;
            obj.children.push(index);
          } else {                // otherwise, push the word to array
            stats.push({text: elm, id: ++wordId, size: 1, children: [index]});
          }
        });


      }
    });

    this.data = stats;
    return this.data;
  };

  dataToWordsArr(delimiters, newData) {

    var pattern = this.setDelimiters(delimiters);
    var matchedWords = this.setMatchWords(newData, pattern);
    this.setStats(matchedWords);

    return this.data; // this.data has : size = the number of occurrences in cloud, children : the indexes of the sentences where the word appears .
  }

  spliceMaxWords( data, maxWords){
    if(maxWords && data.length > maxWords){
      var data = _.sortBy(data,"size");
      data = _.reverse(data);
      data = data.splice(0, maxWords);
      return data;
    }
    return data;
  }

  calcFontSize(id) {
    var arr = [];

    for (var i = 0; i < this.data.length; i++) {
      arr[i] = this.data[i].size;
    }
    this.maxTagged = Math.max(...arr);
    this.minTagged = Math.min(...arr);

    var size = this.data[id].children.length == this.minTagged ? this.fontMin
      : (this.data[id].children.length / this.maxTagged) * (this.fontMax - this.fontMin) + this.fontMin;

    return size;
  }

  getRate(id) {
    while (!isNaN(id)) {
      return (this.data[id].children.length / this.maxTagged).toFixed(2);
    }
  }

  getCurrentDirectory() {
    //@@ Dev Version @@
    /*  var scripts = document.getElementsByTagName("script"), i;
     for (i = 0; i < scripts.length; i++) {
     if (scripts[i].src.search(/index.module.js/i) > 0) {
     break;
     }
     }


     var currentScriptPath = scripts[i].src;*/
    // var resCurrentDirectory = currentScriptPath.substring(0, currentScriptPath.lastIndexOf("/app/") + 1);

    // Build Version :
    var resCurrentDirectory=document.getElementsByTagName("script")[0].baseURI;
    return resCurrentDirectory ;
  }


}



