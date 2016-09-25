/**
 * Created by Harel on 27/07/2016.
 */
describe('wbxWordCloud', function () {

  beforeEach(angular.mock.module('wbxWordCloud'));
  beforeEach(angular.mock.module('one'));

  describe('wordCloud directive test ', function () {
    var $compile,  $rootScope, WordCloudController,
      element, testWordService, cloudApi,d={id:0,hovered:false},
      e={id:1,hovered:true};

    beforeEach(inject(function (_$compile_, _$rootScope_, _$log_, _wordService_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootScope.config = {
        initCloud: function(cApi){
          cloudApi = cApi;
          console.log("Api is: "+cloudApi);
        }
      };
      element = angular.element('<wbx-word-cloud word-cloud-config="config"></wbx-word-cloud>');
      $compile(element)($rootScope);
      $rootScope.$digest();
      WordCloudController = element.isolateScope().vm;
      testWordService = _wordService_;

    }));

    describe('WordCloudController props test', function () {
      it('should check the parent directive', function () {
        expect(WordCloudController.onInit).toBeDefined();
        expect(WordCloudController.element[0]).toBeDefined();
      });
    });

    describe('setText() test', function () {
      //beforeEach(inject(function (_$element_){
      beforeEach(function() {
        this.inputTest=[{
          "id": 0,
          "text": "most"
        }, {
            "id": 313,
            "text": "me"
          }, {
            "id": 314,
            "text": "truth"
          },  {
            "id": 315,
            "text": "just"
          }];

        this.element="Defined";
        });
      it('should compare someText and WordCloudController.text ', function () {
        var someText= [{
          "id": "1",
          "text": "in a"

        }];
        expect(cloudApi.setText).toBeDefined();
        cloudApi.setText(someText,true);
        expect(WordCloudController.text).toEqual(someText);
      });
      it('should check about the config from getConfig() ', function () {

        // TODO: How to test that inner function (handleText )that called by $q.when ??
        var ret=testWordService.getConfig();
        expect(ret.constructor.name).toEqual("Promise");
        // TODO: better test for return value ?

      });

      it('should test wcApi setListener() ', function () {
        expect(cloudApi.setListener).toBeDefined();

        // create some event and check if it bounded to unHookEvent
        var stopCB = cloudApi.setListener('hover', function(){
          alert('x');
          if (stopCB){
            stopCB();
          }
        });

        expect(stopCB.name).toEqual("bound unHookEvent");
      });

      it('this.cloud existence', function () {
        var text=[{
          "id": 0,
          "text": "most"
        },
          {
            "id": 313,
            "text": "me"
          },
          {
            "id": 314,
            "text": "truth"
          },
          {
            "id": 315,
            "text": "just"
          }];
        var delimiters=[",", " ",";"];

        var parsedText= testWordService.dataToWordsArr(delimiters,text)
        WordCloudController.initCloud(parsedText);

        expect(WordCloudController.cloud).toBeDefined();


      });
      it('defineCloud() test', function () {

        WordCloudController.defineCloud(this.inputTest);

        expect(WordCloudController.divideBy).toEqual(3);

        expect(WordCloudController.scale).toEqual(1.4);

        expect(WordCloudController.color(WordCloudController.wordService.fontMin).toUpperCase()).toEqual(WordCloudController.colors[0]);

        expect(WordCloudController.color(WordCloudController.wordService.fontMax).toUpperCase()).toEqual(WordCloudController.colors[WordCloudController.colors.length-1]);


      });
      it('mouseHovered() test', function () {
        WordCloudController.mouseHovered(d);
        expect(d.hovered).toEqual(true);
      });

      it('mouseOut() test', function () {
        WordCloudController.mouseOut(e);
        expect(e.hovered).toEqual(false);
      });


      it('clicked() test', function () {
        window.event={};
        window.event.ctrlKey = true;
        var that =this;
        this.selectedWords=[];
        WordCloudController.clicked.bind({
          isCtrl:window.event.ctrlKey,
          that:that,
          domWord:'text#p1'
      })(d);
        expect(d.selected).toEqual(true);
      });

    });

  });
});



