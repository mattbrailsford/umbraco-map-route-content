using Newtonsoft.Json;
using Our.Umbraco.InnerContent.Converters;
using Our.Umbraco.MapRouteContent.Models;
using Our.Umbraco.MapRouteContent.PropertyEditors;
using System;
using Umbraco.Core;
using Umbraco.Core.Logging;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;

namespace Our.Umbraco.MapRouteContent.Converters
{
	public class MapRouteContentValueConverter : InnerContentValueConverter, IPropertyValueConverterMeta
	{
		public override bool IsConverter(PublishedPropertyType propertyType)
		{
			return propertyType.PropertyEditorAlias.InvariantEquals(MapRouteContentPropertyEditor.PropertyEditorAlias);
		}

		public override object ConvertDataToSource(PublishedPropertyType propertyType, object source, bool preview)
		{
			var value = source?.ToString();
			if (value == null || string.IsNullOrWhiteSpace(value))
				return null;

			try
			{
				var stValue = JsonConvert.DeserializeObject<MapRouteContentValue>(value);
				if (stValue.Markers != null)
				{
					foreach (var marker in stValue.Markers)
					{
						marker.Content = ConvertInnerContentDataToSource(marker.ContentRaw, null, 0, 1, preview);
					}
				}
				return stValue;
			}
			catch (Exception ex)
			{
				LogHelper.Error<MapRouteContentValueConverter>("Error converting value", ex);
			}

			return null;
		}

		public PropertyCacheLevel GetPropertyCacheLevel(PublishedPropertyType propertyType, PropertyCacheValue cacheValue)
		{
			return PropertyCacheLevel.Content;
		}

		public Type GetPropertyValueType(PublishedPropertyType propertyType)
		{
			return typeof(MapRouteContentValue);
		}
	}
}
