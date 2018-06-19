using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Umbraco.Core.Models;

namespace Our.Umbraco.MapRouteContent.Models
{
	public class MapRouteContentMarker
	{
		[JsonProperty("distance")]
		public decimal Distance { get; set; }

		[JsonProperty("latLng")]
		public MapRouteContentLatLng LatLng { get; set; }

		[JsonProperty("content")]
		internal JObject ContentRaw { get; set; }

		[JsonIgnore]
		public IPublishedContent Content { get; set; }
	}
}
