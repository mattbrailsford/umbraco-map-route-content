using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Our.Umbraco.InnerContent.PropertyEditors;
using System.Linq;
using System.Xml.Linq;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Models.Editors;
using Umbraco.Core.PropertyEditors;
using Umbraco.Core.Services;

namespace Our.Umbraco.MapRouteContent.PropertyEditors
{
	[PropertyEditor(PropertyEditorAlias, "Map Route Content", "/App_Plugins/MapRouteContent/views/mrc.html", Group = "rich content", Icon = "icon-map-location", ValueType = "JSON")]
	public class MapRouteContentPropertyEditor : SimpleInnerContentPropertyEditor
	{
		public const string PropertyEditorAlias = "Our.Umbraco.MapRouteContent"; 

		public MapRouteContentPropertyEditor()
			: base()
		{
			DefaultPreValues.Add("maxItems", 0);
		}

		protected override PropertyValueEditor CreateValueEditor()
		{
			return new MapRouteContentValueEditor(base.CreateValueEditor());
		}

		internal class MapRouteContentValueEditor : InnerContentPropertyValueEditorWrapper
		{
			public MapRouteContentValueEditor(PropertyValueEditor wrapped) : base(wrapped)
			{ }

			public override object ConvertDbToEditor(Property property, PropertyType propertyType, IDataTypeService dataTypeService)
			{
				// Convert / validate value
				if (property.Value == null)
					return string.Empty;

				var propertyValue = property.Value.ToString();
				if (string.IsNullOrWhiteSpace(propertyValue))
					return string.Empty;

				var value = JsonConvert.DeserializeObject<JObject>(propertyValue);
				if (value == null)
					return string.Empty;

				// Process inner content value
				var markers = value.GetValue("markers") as JArray;
				if (markers != null)
				{
					foreach (var marker in markers)
					{
						var content = value.GetValue("content") as JObject;
						if (content != null)
						{
							ConvertInnerContentDbToEditor(markers, dataTypeService);
						}
					}
				}

				// Return the JObject, Angular can handle it directly
				return value;
			}

			public override object ConvertEditorToDb(ContentPropertyData editorValue, object currentValue)
			{
				// Convert / validate value
				if (editorValue.Value == null)
					return string.Empty;

				var dbValue = editorValue.Value.ToString();
				if (string.IsNullOrWhiteSpace(dbValue))
					return string.Empty;

				var value = JsonConvert.DeserializeObject<JObject>(dbValue);
				if (value == null)
					return string.Empty;

				// Process inner content value
				var markers = value.GetValue("markers") as JArray;
				if (markers != null)
				{
					foreach (var marker in markers)
					{
						var content = value.GetValue("content") as JObject;
						if (content != null)
						{
							ConvertInnerContentEditorToDb(markers, ApplicationContext.Current.Services.DataTypeService);
						}
					}
				}

				// Return value
				return JsonConvert.SerializeObject(value);
			}

			public override string ConvertDbToString(Property property, PropertyType propertyType, IDataTypeService dataTypeService)
			{
				// Convert / validate value
				if (property.Value == null)
					return string.Empty;

				var propertyValue = property.Value.ToString();
				if (string.IsNullOrWhiteSpace(propertyValue))
					return string.Empty;

				var value = JsonConvert.DeserializeObject<JObject>(propertyValue);
				if (value == null)
					return string.Empty;

				// Process inner content value
				var markers = value.GetValue("markers") as JArray;
				if (markers != null)
				{
					foreach (var marker in markers)
					{
						var content = value.GetValue("content") as JObject;
						if (content != null)
						{
							ConvertInnerContentDbToString(markers, dataTypeService);
						}
					}
				}

				// Return the serialized value
				return JsonConvert.SerializeObject(value);
			}
		}

		protected override PreValueEditor CreatePreValueEditor()
		{
			return new MapRouteContentPreValueEditor();
		}

		internal class MapRouteContentPreValueEditor : SimpleInnerContentPreValueEditor
		{
			[PreValueField("maxItems", "Max Items", "number", Description = "Set the maximum number of locations allowed on the route.")]
			public string MaxItems { get; set; }

			[PreValueField("routeFileParserUrl", "Route File Parser URL", "textstring", Description = "By default routes need to be provided as a JSON array of objects with 'lat' and 'lng' properties. If you want to be able to support other file formats, provide the URL of an API endpoint which can parse these route file and convert them into the required format. The endpoint will be passed the selected media items UDI.")]
			public string RouteFileParserUrl { get; set; }

			[PreValueField("hideLabel", "Hide Label", "boolean", Description = "Set whether to hide the editor label and have the editor take up the full width of the window.")]
			public string HideLabel { get; set; }
		}
	}
}
