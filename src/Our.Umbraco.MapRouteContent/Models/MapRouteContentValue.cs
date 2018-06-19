using Newtonsoft.Json;
using System.Collections.Generic;
using Umbraco.Core;

namespace Our.Umbraco.MapRouteContent.Models
{
	public class MapRouteContentValue
	{
		[JsonProperty("fileId")]
		public Udi FileId { get; set; }

		[JsonProperty("markers")]
		public IEnumerable<MapRouteContentMarker> Markers { get; set; }
	}
}
