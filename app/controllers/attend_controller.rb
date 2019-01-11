class AttendController < ApplicationController
  before_action do
    is_authenticated?(request.path)
  end

  def index
    user = current_user
    @event = kpget("/events/" + params[:event_id])

    if @event['attending'] == true
      redirect_to "/events/#{params[:event_id]}"
      flash[:notice] = "You are already attending this event!"
    elsif user['payment'] == false
      redirect_to '/payment'
    else
      payments = kpget("/payments/")

      # Each payment option is a string-value pair used by select_tag helper
      @payment_options = []
      payments.each do |p|
        payment_type = ""
        case p['paymentType']
        when 3
          payment_type = "American Express"
        when 4
          payment_type = "Visa"
        when 5
          payment_type = "MasterCard"
        when 6
          payment_type = "Discover"
        else
          payment_type = "Other"
        end
        @payment_options.push(["#{payment_type} starting with #{p['number']}", p['id']])
      end

      @submit_url = "/events/#{@event['slug']}/attend"
      @baseCost = @event['tiers'][0]['baseCostPerAttendee']
      @processingFee = @event['tiers'][0]['serviceChargePerAttendee']
      @totalPrice = @event['tiers'][0]['totalCostPerAttendee']

      # TODO: all logic associated with userSetPrice
      userSetPrice = @event['tiers'][0]['userSetPrice']

    end
  end

  def create
    attend_response = kppost("/attendees", query: {
      eventId: params[:event_id],
      paymentId: params[:payment_id],
      contribution: params[:contribution],
      note: params[:note],
      guests: []
    })

    if attend_response['error']
      # TODO
      # Handle error
      return
    end

    # post note to wall if box was checkmarked
    if params[:post_to_event_page]
      kppost("/posts", query: {
        :post => {
          eventId: params[:event_id],
          body: params[:note]
        }
      })
      # TODO
      # Handle error
    end

    # redirect back to event page
    redirect_to "/events/#{params[:event_id]}"
  end
end
