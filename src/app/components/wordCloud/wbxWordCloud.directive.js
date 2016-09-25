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
        deselectAll: that.deselectAll.bind(this),
        getCloudWords:that.getCloudWords.bind(this)
      };


      /* notify parent about onInit
       The validation is to check if there is in the external directive has the init function before we send to it the Api
       the 'config' var will be the external controller .
       */
      if (angular.isDefined(that.config) && angular.isFunction(that.config.initCloud)) {
        that.config.initCloud(that.wordCloudApi);
        that.configUrl = that.config.configUrl;
        that.configParams = that.config.configParams;
      }
      else console.log("no initCloud define in external controller");
    };
    this.selectedWords = [];
    $element.on("$destroy", function () {
      console.log("wordCloud controller destroyed");
    })
  }

  getCloudWords(){
    return _.cloneDeep(this.data)
  }

  defineCloud(data) {
    var that = this;

    that.elem = that.element[0];

    /* that.w = that.elem.clientWidth;  // check if matter using that than $element that.element.parent().width();
     that.h = that.element.parent().parent().height();*/
    that.w = that.elem.clientWidth;  // check if matter using that than $element
    that.h = that.elem.clientHeight;

    that.colors = ["#9FA8DA", "#7986CB", "#5C6BC0", "#3F51B5", "#3949AB", "#303F9F", "#283593", "#1A237E"];

    that.color = d3.scale.linear()
      .domain([that.wordService.fontMin, that.wordService.fontMax])
      .range([that.colors [0], that.colors [7]]);

    that.divideBy = 1;
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

    var that = this.that

    that.clickFlag = true;//a flag to know that was click on a word and to not propagate the event to the deselectAll event
    // CTRL click handling :
    if (window.event.ctrlKey || this.isCtrl) { // this.ctrl for testing
      if (that.cloud.select('#p' + d.id).classed("selected")/*d.selected*/) {
        _.remove(that.selectedWords, d);
        that.cloud.select('#p' + d.id).classed("selected", !that.cloud.select('#p' + d.id).classed("selected") /*!d.selected*/);
        if (that.selectedWords.length == 0) {
          d3.select(that.elem).classed("selection-mode", that.cloud.select('#p'+d.id).classed("selected")/*!d.selected*/);
        }
        that.runListeners('onSelect', d, that.selectedWords);
      } else {
        that.selectedWords.push(d);
        that.cloud.select('#p' + d.id).classed("selected", !that.cloud.select('#p' + d.id).classed("selected") /*!d.selected*/);
        d3.select(that.elem).classed("selection-mode", that.cloud.select('#p' + d.id).classed("selected")/*!d.selected*/);
        that.runListeners('onSelect', d, that.selectedWords);
      }
    }
    // single click handling :
    else {
      /*  _.forEach( that.data, function(item){
       item.selected = false;
       });*/
      var flag = that.cloud.select('#p' + d.id).classed("selected"); // d.selected;
      that.cloud.selectAll('text').classed('selected', false);
      that.selectedWords.splice(0, that.selectedWords.length);
      that.selectedWords.push(d);
      that.cloud.select('#p' + d.id).classed("selected", !flag);
      d3.select(that.elem).classed("selection-mode", !flag);
      if (angular.isDefined(that.runListeners)) { // for testing
        that.runListeners('onSelect', d, undefined); // undefined array in case of single select
      }
    }
    that.clickFlag = true;
    //console.log("clicked: "+ that.clickFlag);
  }

  inDeselectAll() {
    // click outside words cause unselect
    //for each  selected item, unselect it.
    //console.log("inDeselectAll: "+ this.clickFlag);
    if (!this.clickFlag) {
      this.cloud.selectAll('.selected').classed('selected', false);
      d3.select(this.elem).classed("selection-mode", false);
      this.runListeners('onSelect', undefined);
    }
    this.clickFlag = false;

  }

  deselectAll() {
    // click outside words cause unselect
    //for each  selected item, unselect it.
    this.cloud.selectAll('.selected').classed('selected', false);
    d3.select(this.elem).classed("selection-mode", false);
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
        d3.select(this).on("click", that.clicked.bind({that: that}));
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

  initCloud(data , selectedWords) {


    var that = this;

    this.defineCloud(data);
    // When isInitialized -->  remove cloud , otherwise --> append layout to the existing svg and g
    if (this.cloud) {
      this.cloud = null;
      //d3.select(that.elem.childNodes[0]).remove();  // the div of the any wordCloud is has 2 childNodes: #text and SVG . by removing svg we adding it to the same div.
      d3.select(that.elem).select("svg").remove();
      that.elem = null;
    }
    that.elem = that.element[0];


    this.data = data;
    var innerThat = that;

    that.scale = 1;

    let maxSize = _.maxBy(innerThat.data, 'size').size;

    this.cloud = d3.select(that.elem).append("svg")
      .attr("viewBox", "0 0 " + that.w + " " + that.h + "")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .on('click', that.inDeselectAll.bind(that))
      .append("g")
      .attr("transform", "translate(" + (that.w / 2) + "," + (that.h / 2) + ")scale(" + that.scale + ")")
      .attr("margin", "auto");

    that.scale = 1;
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
        return (d.size / maxSize) * 20 + 12;
      })
      .on("end", innerThat.draw.bind(innerThat)) // when the layout has finished attempting to place all words an "end" event is dispatched
      .start();

    let flag = false;
    //d3.select(this.elem).classed("selection-mode",  selectedWords && selectedWords.length > 0);
    if(selectedWords){// && selectedWords.length > 0) {//if we get selected words
      this.cloud.selectAll("text").classed("selected",function(d){
        let isExist = _.indexOf( selectedWords, d.text) != -1;
        if(isExist)
          flag = true;
        return isExist;
      });
      d3.select(this.elem).classed("selection-mode", flag);
    }
  }
}


