using Newtonsoft.Json;

namespace Our.Umbraco.MapRouteContent.Models
{
	public class MapRouteContentLatLng
	{
		[JsonProperty("lat")]
		public decimal Lat { get; set; }

		[JsonProperty("lng")]
		public decimal Lng { get; set; }
	}
}
