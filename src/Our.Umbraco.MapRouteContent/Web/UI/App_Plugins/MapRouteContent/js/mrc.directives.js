angular.module("umbraco.directives").directive('mrcMediaPickerWrapper',
[
	function (metaDataDialogService) {

		var link = function ($scope, element, attrs, ctrl) {

			$scope.showAdd = function () {
				return $scope.pick;
			};

			$scope.add = function () {
				$scope.mediaPickerOverlay = {
					view: "mediapicker",
					title: "Select media",
					multiPicker: false,
					show: true,
					submit: function (model) {
						$scope.onPick({ pickedItem : model.selectedImages[0] });
						$scope.mediaPickerOverlay.show = false;
						$scope.mediaPickerOverlay = null;
					}
				};
			};

		}

		return {
			restrict: "E",
			replace: true,
			transclude: true,
			template: "<div class='umb-editor umb-mediapicker'>" +

			"<ul class='umb-sortable-thumbnails' ng-if='showAdd()'>" +
			"<li style='border: none;'>" +
			"<a href='#' class='add-link add-link-square' ng-click='add()' prevent-default>" +
			"<i class='icon icon-add large'></i>" + 
			"</a>" +
			"</li>" +
			"</ul>" +

			"<div ng-if='!showAdd()' ng-transclude></div>" +

			"<umb-overlay ng-if='mediaPickerOverlay.show' model='mediaPickerOverlay' position='right' view='mediaPickerOverlay.view'></umb-overlay >" +

			"</div>",
			scope: {
				pick: "=",
				onPick: '&'
			},
			link: link
		};

	}
]);