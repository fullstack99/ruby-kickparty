'use strict';

var ResourcesController = function ResourcesController(id, node, cb) {
  if (node) {
    this.node = node;
  } else if (id) {
    this.node = document.getElementById(id);
  }

  this.cb = cb;

  this._resources = [];
  this.resourceType = this.node.dataset.type;
  this.resourceTotal = 0;

  this.name = this.node.querySelector('.resource-name');
  this.description = this.node.querySelector('.resource-description');
  this.price = this.node.querySelector('.resource-cost');
  this.private = this.node.querySelector('.resource-private');
  this.addButton = this.node.querySelector('.btn-add');
  this.renderedResources = this.node.querySelector('.added-resources');
  this.addButton.onclick = this.add.bind(this);
  this.preload();
};

ResourcesController.prototype.preload = function () {
  var preloadedResources = this.renderedResources.querySelectorAll('.row');

  if (preloadedResources.length > 0) {
    for (var i = 0, j = preloadedResources.length; i < j; i++) {
      var resourceRow = preloadedResources[i];
      var name = resourceRow.querySelector('.name').innerText;
      var description = resourceRow.querySelector('.description').innerText;
      var price = resourceRow.querySelector('.price').innerText;
      var tierResourceId = ~ ~resourceRow.dataset.tierresourceid;
      var resourceId = ~ ~resourceRow.dataset.resourceid;
      var removeLink = resourceRow.querySelector('.remove');
      removeLink.onclick = this.remove.bind(this);

      var resource = {
        name: name,
        description: description,
        tierResourceId: tierResourceId,
        resourceId: resourceId,
        price: price.replace('$', ''),
        resource_type_id: ~ ~this.resourceType,
        'private': true
      };

      this._resources.push(resource);
    }

    this.updateTotal();
  }
};

ResourcesController.prototype.add = function (ev) {
  this._resources.push({
    name: this.name.value,
    description: this.description.value,
    price: Utils.tryParseFloat(this.price.value),
    'private': true, //this.private.value,
    resource_type_id: ~ ~this.resourceType
  });

  this.name.value = '';
  this.description.value = '';
  this.price.value = '';

  this.update();
};

ResourcesController.prototype.renderResources = function () {
  while (this.renderedResources.firstChild) {
    this.renderedResources.removeChild(this.renderedResources.firstChild);
  }

  for (var i = 0, j = this._resources.length; i < j; i++) {
    var resource = this._resources[i];
    var divRow = Utils.nodeFactory('div', ['row']);
    var colOne = Utils.nodeFactory('div', ['col-md-1'], '<div class="resource-image">' + resource.name.slice(0, 2) + '</div>');
    var colTwo = Utils.nodeFactory('div', ['col-md-10']);
    var colThree = Utils.nodeFactory('div', ['col-md-1'], '<div class="price">' + Utils.formatCurrency(resource.price) + '</div>');

    var descHeading = Utils.nodeFactory('h5', ['name'], resource.name + ' ');
    var description = Utils.nodeFactory('p', ['description'], resource.description);
    var removeLink = Utils.nodeFactory('a', null, 'Remove', { 'data-i': i });
    removeLink.onclick = this.remove.bind(this);
    descHeading.appendChild(removeLink);

    colTwo.appendChild(descHeading);
    colTwo.appendChild(description);

    divRow.appendChild(colOne);
    divRow.appendChild(colTwo);
    divRow.appendChild(colThree);

    this.renderedResources.appendChild(divRow);
  }
};

ResourcesController.prototype.updateTotal = function () {
  var total = 0;

  for (var i = 0, j = this._resources.length; i < j; i++) {
    var price = Utils.tryParseFloat(this._resources[i].price);

    if (price) {
      total += price;
    }
  }

  this.resourceTotal = total;

  var totalNode = this.node.querySelector('.total');
  totalNode.textContent = this.resourceTotal > 0 ? Utils.formatCurrency(this.resourceTotal) : 'FREE';
};

ResourcesController.prototype.remove = function (ev) {
  var index = ev.target.dataset.i;
  var removedResource = this._resources.splice(index, 1);

  console.info(removedResource);

  if (removedResource[0] && removedResource[0].resourceId) {
    var resourceId = removedResource[0].resourceId;
    var tierId = window.tierId;
    var eventSlug = window.slug;

    console.info(eventSlug, resourceId, tierId);

    Api.delete('/resources/' + eventSlug, { resourceId: resourceId, tierId: tierId }).then(function (res) {
      console.info('RES', res);
    }, function (err) {
      console.log('ERR', err);
    });
  }

  this.update();
};

ResourcesController.prototype.update = function () {
  this.renderResources();
  this.updateTotal();

  if (this.cb instanceof Function) {
    this.cb(this.resourceType, this._resources, this.resourceTotal);
  }
};