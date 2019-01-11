var eventsTmpl = $.templates(
  '<div class=\'col-sm-4 margin30\'>\
      <div>\
          <a href=\'/events/{{:slug}}\'>\
              <div class=\'item-img-wrap\'>\
                  <img src=\'{{:headerImg}}\' class=\'img-responsive\' alt=\'workimg\'>\
                  <div class=\'item-img-overlay\'>\
                      <span></span>\
                  </div>\
              </div>\
          </a>\
          <div class=\'news-desc\'>\
              <h4><a href=\'/events/{{:slug}}\'>{{:name}}</a></h4>\
              <span>Kicks {{:deadline}}</span> <span><a href=\'/{{:slug}}\'>Check it...</a></span>\
          </div>\
      </div>\
  </div>'
)

var postsTmpl = $.templates(
  "<li class='post'>\
    <a href='/{{:user.slug}}' class='profile-link'>\
      <div class='profile-image' style='background-image:url({{:user.profileImg}});'>\
        <div class='initials'></div>\
      </div>\
    </a>\
    <div class='post-text'>\
      <a style='font-weight:700;' class='' href='/{{:user.slug}}'>{{:user.firstName}} {{:user.lastName}}</a>\
      <p style='margin-top:0;margin-bottom:0;text-align:left;color:#8899a6;font-size:85%;'>{{:createdAt}}</p>\
      <p style='margin-top:0;margin-bottom:0;text-align:left;'>{{:body}}</p>\
      <div style='display:flex;margin-top:6px;font-size:.85em;'>\
       <!-- Put back in when ready to implement:\
       <a style='margin:10px 15px 5px;color:#aaa;'>\
          <i class='fa fa-thumbs-up'></i>\
          <span> Like</span>\
        </a>\
        <a style='margin:10px 15px 5px;display:none;'>\
          <i class='fa fa-comments'></i>\
          <span> Comment</span>\
        </a> -->\
      </div>\
    </div>\
  </li>\
  "
)

var attendeesTmpl = $.templates(
  "<li class='invitee'> \
    <a href='/{{:slug}}' class='profile-link' title='{{:firstName}} {{:lastName}}'> \
      <div class='profile-image' style='background-image:url({{:profileImg}});background-size:100%;border:4px #fff solid;border-radius:50%;height:70px;width:70px;margin:undefined;'> \
        <div class='initials'> \
        </div> \
      </div> \
    </a> \
  </li>"
)

//{{include resources tmpl='resourcesTmpl'/}} \
