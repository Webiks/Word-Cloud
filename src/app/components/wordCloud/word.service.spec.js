/**
 * Created by Harel on 27/07/2016.
 */
describe('wordService', function () {
  beforeEach(angular.mock.module('untitled1'));
  beforeEach(angular.mock.module('wbxWordCloud'));

  describe('wordService test ', function () {
    var testWordService,$http,$q,defer;

    beforeEach(inject(function ( _wordService_,_$http_,_$q_) {
      testWordService = _wordService_;
      $http=_$http_;
      $q=_$q_;
      defer = $q.defer();

    }));
 
    describe('HardCodeded test of getConfig and dataToWordsArr', function () {
      it('should get the delimiter from the config file and then trigger dataToWordsArr() and then to init the cloud with the parsed data!', function () {
        testWordService.data=[{
          "id": 312,
          "text": "Beth"
        },
          {
            "id": 313,
            "text": "Beth"
          },
          {
            "id": 314,
            "text": "Stacey"
          },
          {
            "id": 315,
            "text": "Franklin"
          }];

            var delimiters = [",", " ",";"];

            var parsedData = testWordService.dataToWordsArr(delimiters,testWordService.data);

            for(var i=0;i<parsedData.length;i++) {
              console.log("And  is:" + parsedData[i]);
            }
            expect(parsedData).toBeDefined();
      });
    });

    describe('sub functions of dataToWordsArr test', function () {
      beforeEach(function() {
        this.inputTest=[{
          "id": 0,
          "text": "Beth is the most"
        },
          {
            "id": 313,
            "text": "Beth was telling me"
          },
          {
            "id": 314,
            "text": "Stacey the truth"
          },
          {
            "id": 315,
            "text": "Franklin is not just truth"
          }];
        this.delimiters=[",", " ",";"];
      });

      it('should test setDelimiters()', function () {
       expect(testWordService.setDelimiters().constructor.name).toEqual("RegExp");
      });

       it('should test setMatchWords()', function () {
        var pattern=testWordService.setDelimiters(this.delimiters);
        var ret=testWordService.setMatchWords(this.inputTest,pattern);
        expect(ret[0].length).toBeGreaterThan(0); // execpt a empty cloud
      });
      it('should test setStats()', function () {
         // check if data exist in matched words..
        console.log(testWordService.data);
        var pattern=testWordService.setDelimiters(this.delimiters);
        var data=testWordService.setMatchWords(this.inputTest,pattern);
        var ret=testWordService.setStats(data);
        expect(ret).toBeDefined();

      });
    });

    describe('calcFontSize() test', function () {
     it('should return the font size by word frequency', function () {

       var data= [
         {
           "id": "0",
           "text": "Sinai",
           size:1,
           children:[1]

         },
         {
           "id": 300,
           "text": "midnight ",
           size:3,
           children:[8,4,6]
         },
         {
           "id": 301,
           "text": "הראל",
           size:8,
           children:[1,2,3,4,5,6,7,9]
         },
         {
           "id": 302,
           "text": "Hebron ",
           size:5,
           children:[0,1,22,33,8]

         }];
       var fontMin = 12, fontMax = 32;

       var sinaiSize=testWordService.calcFontSize.bind({
         data:data,
         fontMin:fontMin,
         fontMax:fontMax
       })(0);

       expect(sinaiSize).toEqual(12);
       });
     });

    describe('getCurrentDirectory test', function () { // need to bind it to directive, cuz function uses document
      it('should return string', function () {
        var ret =testWordService.getCurrentDirectory();
        var found=ret.search('/app/');
        expect(found).toBeGreaterThan(0);
      });
    });
  });
});
