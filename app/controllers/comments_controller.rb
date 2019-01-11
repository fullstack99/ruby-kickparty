class CommentsController < ApplicationController
  def create
    puts "Comment create"
    # TR: I had this wrong, thought the "posts" were comments. Keep this here so we can move things around.
    # TODO: Make a PostsController and make Comments a sub resource of that instead. Unless you can comment on anything, then just a base level CommentsController. 
    # r = kppost("/comments", query: {
    #   body: params[:comment],
    #   object_id: params[:event_id],
    #   object_type_id: 2, 
    # })
    # r = kppost("/posts", query: {
    #   "post[body]" => params[:comment],
    #   "post[event_id]" => params[:event_id],
    # })
    # respond_to do |format|
    #   format.html { redirect_to event_path(params[:event_id]), notice: 'Post was successfully created.' }
    #   format.js { 
    #     render ""
    #   }
    # end
  end
end
