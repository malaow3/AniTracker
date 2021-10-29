/**
* @author malaow3
* @file Performs web based JS functions
*/

// On load, we want to define the table as sortable and order it by watch time
$(function () {
  $('#anitable').DataTable({
    "paging": false,
    "searching": false,
    columnDefs: [
      { "type": "time", targets: 9 },
      { 'orderData': 9, 'targets': 5 },
      {
        orderable: false,
        targets: [0, 6]
      },
    ],
    "order": [[9, "desc"]],
    "bInfo": false
  } as any);
});


/**
 * @description This function is called when the user clicks the "Untrack" button.
 * It will remove the show from the database and refresh the page.
 * @param UID - UID of the show to be untracked; format is "showTitle|showID|seasonID|platform"
 */
async function untrack(UID: string) {

  let data = UID.split("|");
  let showTitle = data[0];
  let showID = data[1];
  let seasonID = data[2];

  let ID = showTitle + "|" + showID + "|" + seasonID;
  let platform = data[3];

  let formData = {
    "uid": ID,
    "platform": platform
  };
  // send post request to server to mark show as untracked
  $.ajax({
    url: '/untrack',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify(formData),
    processData: false,
    success: function (data, textStatus, jQxhr) {
      console.log("SUCCESS RECEIVED")
      location.reload();
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.log('error', errorThrown)
    }
  });

}


/**
 * @description This function is called when the user clicks the "Track" button.
 * It will add the show to the database and refresh the page.
 * @param {string} UID - UID of the show to be tracked; format is "showTitle|showID|seasonID|platform"
 */
async function track(UID: string) {
  let data = UID.split("|");
  let showTitle = data[0];
  let showID = data[1];
  let seasonID = data[2];

  let ID = showTitle + "|" + showID + "|" + seasonID;
  let platform = data[3];

  $("#modbod").html("")
  $("#exampleModalLabel").text(showTitle as string)
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var graphql = JSON.stringify({
    query: `query{
        Page(page: 0, perPage: 50){
          media(search: \"${showTitle}\", type: ANIME){
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
            }
            siteUrl
          }
        }
      }`,
    variables: {}
  })
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: graphql,
    redirect: 'follow'
  } as RequestInit;

  try {
    let response = await fetch("https://graphql.anilist.co", requestOptions)
    const data = await response.json();
    for (let item of data.data.Page.media) {
      let title = item.title.english
      if (title == null) {
        title = item.title.romaji
        if (title == null) {
          title = item.title.native
        }
      }
      $("#modbod").html($("#modbod").html() + `
          <div class="row">
            <div class="col-md-1"></div>
            <div class="col-md-2">
              <img class="img-fluid" src="${item.coverImage.extraLarge}">
            </div>
            <div class="col-md-1"></div>
            <div class="col-md-8">
              <h3>${title}</h3>
              <a target="_blank" href="${item.siteUrl}">View on AniList</a>
              <br><br>
              <button class="btn btn-light" onclick='trackShow("${ID}", "${item.id}", "${platform}")'> Select </button>
            </div>
          </div>
          <br/>
        `)
    }

  }
  catch (error) {
    console.log('error', error);
  }
}


/**
 * @description This function is called when the user clicks the "Select" button.
 * @param {string} UID - UID of the show to be tracked; format is "showTitle|showID|seasonID"
 * @param {string} anilistID - Anilist ID of the show to be tracked
 * @param {string} platform - Platform of the show to be tracked
 */
function trackShow(UID: string, anilistID: string, platform: string) {
  // make a post request to the server to track the show
  let formData = {
    "uid": UID,
    "anilistID": anilistID,
    "platform": platform
  };

  $.ajax({
    url: '/',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify(formData),
    processData: false,
    success: function (data, textStatus, jQxhr) {
      console.log("SUCCESS RECEIVED")
      $("#exampleModal").modal("hide");
      location.reload();
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.log('error', errorThrown)
    }
  });

}
