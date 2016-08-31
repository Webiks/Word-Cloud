/**
 * Created by Harel on 24/07/2016.
 */
import {wordService} from './word.service.js';
import {wbxWordCloud} from './wbxWordCloud.directive.js';

angular.module('wbxWordCloud', [])
  .service('wordService', wordService)
  .directive('wbxWordCloud', wbxWordCloud);
