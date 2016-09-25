/**
 * Created by Harel on 05/06/2016.
 */
export function wbxWordCloud() {
  'ngInject';

  let directive = {
    templateUrl: 'app/components/wordCloud/wordCloud.html',
    controller: WordCloudController,
    controllerAs: 'vm',
    scope: {
      words: '=',
      config: "=wordCloudConfig"
    },
    replace: true,
    bindToController: true,
    link: linkFunc

  };


  function linkFunc(scope, element, attr, ctrl) { // element = div of the wordCloud

    ctrl.onInit();

    scope.$on("$destroy,", function () {
      ctrl.element = null;
      console.log("wordCloud directive destroyed");

    })
  }

  return directive;
}

class WordCloudController {
  constructor(wordService, $element) {
    'ngInject';

    this.count = 0;
    var that = this;
    this.element = $element;
    this.wordService = wordService;
    this.runListeners = this.wordService.runListeners.bind(this);
    this.onInit = function onInit() {
      /* setup the API
       The purpose of the next 10 lines is to set API to any external directive that want to adapt the cloud so it can use setText or setListener.
       bind(this):
       The wordCloudApi is outing 2 functions and with binding this so it will use 'this' in the functions as the specific scope
       and will not use the parent scope.
       */
      that.wordCloudApi = {
        setText: that.wordService.setText.bind(this),
        setListener: that.wordService.setListener.bind(this),
        onSelect: that.wordService.onSelect.bind(this),
        onHover: that.wordService.onHover.bind(this),
        getCloudWords :  that.getCloudWords()

      };



      /* notify parent about onInit
       The validation is to check if there is in the external directive has the init function before we send to it the Api
       the 'config' var will be the external controller .
       */
      if (angular.isDefined(that.config) && angular.isFunction(that.config.initCloud)) {
        that.config.initCloud(that.wordCloudApi);
        that.configUrl=that.config.configUrl;
        that.configParams=that.config.configParams;
      }
      else console.log("no initCloud define in external controller");
    };
    this.selectedWords = [];
    $element.on("$destroy", function () {
      console.log("wordCloud controller destroyed");
    })
  }
getCloudWords(){
  return _.cloneDeep(that.data)
}
  defineCloud(data) {
    var that = this;

    that.elem = that.element[0];

    that.w = that.elem.clientWidth;  // check if matter using that than $element
    that.h = that.elem.clientHeight;

    /*
     * Compute size of the word cloud by the length of the input words:
     * */
    var dataLength = data.length;

    var charSum = 0;
    var pixNeeded = 0;

    _.forEach(data, function (word) {
      charSum += word.text.length;
      pixNeeded += that.wordService.calcFontSize(word.id) * word.text.length;
    });

    that.divideBy = pixNeeded < 7000 ? 2.5
      : pixNeeded < 9000 ? 2
      : pixNeeded < 12000 ? 1.7
      : pixNeeded < 13000 ? 1.6
      : pixNeeded < 15000 ? 1.5
      : pixNeeded < 16000 ? 1.4
      : pixNeeded < 17000 ? 1.3
      : 1;

    /*
     * Compute size of the scale by the length of the input words:
     * */
    if (dataLength < 30) {
      that.scale = 1.4;
    }
    else if (dataLength > 30 && dataLength < 100) {
      that.scale = 1.3;
    }
    else if (dataLength > 100 && dataLength < 150) {
      that.scale = 1.2;
    }
    else if (dataLength > 150 && dataLength < 250) {
      that.scale = 0.9;
    }
    else
      that.scale = 0.8;

    that.colors = ["#9FA8DA", "#7986CB", "#5C6BC0", "#3F51B5", "#3949AB", "#303F9F", "#283593", "#1A237E"];

    that.color = d3.scale.linear()
      .domain([that.wordService.fontMin, that.wordService.fontMax])
      .range([that.colors [0], that.colors [7]]);

    if (that.h<600 ||that.w<500) // little window handling
    {
      that.divideBy=1;
      that.scale=0.8;
      if(pixNeeded>15000) { //little window and lots of words handling by shrink font
        that.wordService.fontMax = 24;
        that.wordService.fontMin = 8;
      }
    }

  }

  mouseHovered(d) {
    this.cloud.select('#p' + d.id).classed("hovered", !d.hovered);
    d3.select(this.element[0]).classed("hovered-mode", !d.hovered);
    this.runListeners('onHover', d);
  }

  mouseOut(d) {
    this.cloud.select('#p' + d.id).classed("hovered", !d.hovered);
    d3.select(this.element[0]).classed("hovered-mode", !d.hovered);
    this.runListeners('onHover', d);
  }

  clicked(d) {
    if (angular.isDefined(event.stopPropagation)) { // for testing
      event.stopPropagation();
      event.preventDefault();
    }
    var that = this.that,
      domWord = this.domWord;
    // CTRL click handling :
    if (window.event.ctrlKey || this.isCtrl) { // this.ctrl for testing
      if (that.cloud.select('#p' + d.id).classed("selected")/*d.selected*/) {
        _.remove(that.selectedWords, d);
        that.cloud.select('#p' + d.id).classed("selected", !that.cloud.select('#p' + d.id).classed("selected") /*!d.selected*/);
        if(that.selectedWords.length==0) {
        d3.select(that.elem).classed("selection-mode", that.cloud.select(domWord).classed("selected")/*!d.selected*/);
		}
        that.runListeners('onSelect', d, []);
      } else {
        that.selectedWords.push(d);
        that.cloud.select('#p' + d.id).classed("selected", !that.cloud.select('#p' + d.id).classed("selected") /*!d.selected*/);
        d3.select(that.elem).classed("selection-mode",that.cloud.select('#p' + d.id).classed("selected")/*!d.selected*/);
        that.runListeners('onSelect', d, that.selectedWords);
      }
    }
    // single click handling :
    else {
      var flag = that.cloud.select('#p' + d.id).classed("selected"); // d.selected;
      that.cloud.selectAll('.selected').classed('selected', false);
      that.selectedWords.splice(0, that.selectedWords.length);
      that.selectedWords.push(d);
      that.cloud.select('#p' + d.id).classed("selected", !flag);
      d3.select(that.elem).classed("selection-mode", !flag);
      if (angular.isDefined(that.runListeners)) { // for testing
        that.runListeners('onSelect', d, undefined); // undefined array in case of single select
      }
    }

  }

  deselectAll() {
    // click outside words cause unselect
    //for each  selected item, unselect it.
    this.cloud.selectAll('.selected').classed('selected', false);
    d3.select(this.elem).classed("selection-mode", false);
    this.runListeners('onSelect', undefined);
  }

  draw() {
    var that = this;
    that.cloud
      .attr("transform", "translate(" + (that.w / 2) + "," + (that.h / 2) + ")scale(" + that.scale + ")") // re translate
      .selectAll("text")
      .data(that.data)
      .enter().append("text")
      .attr("id", function (d) {
        return "p" + d.id;
      })
      .transition()
      .duration(500)
      .attr("text-anchor", "middle")
      .attr("transform", function (d) {
        return "translate(" + [d.x, d.y] + ")";
      }).each(function (d) {
        d3.select(this).on("click", that.clicked.bind({that: that, domWord: this}));
      })
      .each(function (d) {
        d3.select(this).on("mouseover", that.mouseHovered.bind(that));
      })
      .each(function () {
        d3.select(this).on("mouseout", that.mouseOut.bind(that));
      })
      .attr('opacity', 1)
      .style("font-size", function (d) {
        return d.size + "px";
      })
      .style("font-family", "'Noto Sans Hebrew', 'roboto'")
      .style("fill", function (d) {
        return that.color(d.size);
      })
      .text(function (d, i) {
        return d.text;
      });
  }

  /**
   * @description Sets the cloud and the layout
   *              1) Gets data and define dimensions of the cloud by defineCloud
   *              2) remove existing cloud to avoid multiplication of the cloud (in case of inserting new words to existing cloud) (test there is only one cloud in teh div)
   *              3) appends alot of attrs to the cloud (test if all of them exist)
   *              4) appends alot of attrs to the layout (test if all of them exist)
   *              5) dispatching draw() (test if it was dispatched)
   *
   * @param data
   * @returns --
   */

  initCloud(data) {
    var that = this;
    this.defineCloud(data);
    // When isInitialized -->  remove cloud , otherwise --> append layout to the existing svg and g
    if (this.cloud) {
      this.cloud = null;
      d3.select(that.elem.childNodes[0]).remove();  // the div of the any wordCloud is has 2 childNodes: #text and SVG . by removing svg we adding it to the same div.
      that.elem = null;
    }
    that.elem = that.element[0];

    this.data = data;
    var innerThat = that;

    this.cloud = d3.select(that.elem).append("svg")
      .attr("viewBox", "0 0 " + that.w + " " + that.h + "")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .on('click', that.deselectAll.bind(that))
      .append("g")
      .attr("transform", "translate(" + (that.w / 2) + "," + (that.h / 2) + ")scale(" + that.scale + ")")
      .attr("margin", "auto");

    this.layout = d3.layout.cloud().size([that.w / that.divideBy, that.h / that.divideBy])
      .words(that.data)
      .timeInterval(Infinity)
      .padding(2)
      .rotate(function () {
        return 0;
      })
      .font("'Noto Sans Hebrew', 'roboto'")
      .spiral('rectangular')
      .text(function (d) {
        return d.text;
      })
      .fontSize(function (d) {
        return innerThat.wordService.calcFontSize(d.id);
      })
      .on("end", innerThat.draw.bind(innerThat)) // when the layout has finished attempting to place all words an "end" event is dispatched
      .start();
  }


}

