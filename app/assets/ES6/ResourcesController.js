const ResourcesController = function (id, node, cb) {
  if (node) {
    this.node = node
  } else if (id) {
    this.node = document.getElementById(id)
  }

  this.cb = cb

  this._resources = []
  this.resourceType = this.node.dataset.type
  this.resourceTotal = 0

  this.name = this.node.querySelector('.resource-name')
  this.description = this.node.querySelector('.resource-description')
  this.price = this.node.querySelector('.resource-cost')
  this.private = this.node.querySelector('.resource-private')
  this.addButton = this.node.querySelector('.btn-add')
  this.renderedResources = this.node.querySelector('.added-resources')
  this.addButton.onclick = this.add.bind(this)
  this.preload()
}

ResourcesController.prototype.preload = function () {
  const preloadedResources = this.renderedResources.querySelectorAll('.row')

  if (preloadedResources.length > 0) {
    for (let i = 0, j = preloadedResources.length; i < j; i++) {
      const resourceRow = preloadedResources[i]
      var name = resourceRow.querySelector('.name').innerText
      var description = resourceRow.querySelector('.description').innerText
      var price = resourceRow.querySelector('.price').innerText
      var tierResourceId = ~~resourceRow.dataset.tierresourceid
      var resourceId = ~~resourceRow.dataset.resourceid
      var removeLink = resourceRow.querySelector('.remove')
      removeLink.onclick = this.remove.bind(this)

      const resource = {
        name,
        description,
        tierResourceId,
        resourceId,
        price: price.replace('$', ''),
        resource_type_id: ~~this.resourceType,
        'private': true
      }

      this._resources.push(resource)
    }

    this.updateTotal()
  }
}

ResourcesController.prototype.add = function (ev) {
  this._resources.push({
    name: this.name.value,
    description: this.description.value,
    price: Utils.tryParseFloat(this.price.value),
    'private': true, //this.private.value,
    resource_type_id: ~~this.resourceType
  })

  this.name.value = ''
  this.description.value = ''
  this.price.value = ''

  this.update()
}

ResourcesController.prototype.renderResources = function () {
  while (this.renderedResources.firstChild) {
    this.renderedResources.removeChild(this.renderedResources.firstChild)
  }

  for (let i = 0, j = this._resources.length; i < j; i++) {
    const resource = this._resources[i]
    const divRow = Utils.nodeFactory('div', ['row'])
    const colOne = Utils.nodeFactory('div', ['col-md-1'], `<div class="resource-image">${resource.name.slice(0, 2)}</div>`)
    const colTwo = Utils.nodeFactory('div', ['col-md-10'])
    const colThree = Utils.nodeFactory('div', ['col-md-1'], `<div class="price">${Utils.formatCurrency(resource.price)}</div>`)

    const descHeading = Utils.nodeFactory('h5', ['name'], `${resource.name} `)
    const description = Utils.nodeFactory('p', ['description'], resource.description)
    const removeLink = Utils.nodeFactory('a', null, 'Remove', { 'data-i': i })
    removeLink.onclick = this.remove.bind(this)
    descHeading.appendChild(removeLink)

    colTwo.appendChild(descHeading)
    colTwo.appendChild(description)

    divRow.appendChild(colOne)
    divRow.appendChild(colTwo)
    divRow.appendChild(colThree)

    this.renderedResources.appendChild(divRow)
  }
}

ResourcesController.prototype.updateTotal = function () {
  let total = 0

  for (let i = 0, j = this._resources.length; i < j; i++) {
    const price = Utils.tryParseFloat(this._resources[i].price)

    if (price) {
      total += price
    }
  }

  this.resourceTotal = total

  const totalNode = this.node.querySelector('.total')
  totalNode.textContent = (this.resourceTotal > 0) ? Utils.formatCurrency(this.resourceTotal) : 'FREE'
}

ResourcesController.prototype.remove = function (ev) {
  const index = ev.target.dataset.i
  const removedResource = this._resources.splice(index, 1)

  console.info(removedResource)

  if (removedResource[0] && removedResource[0].resourceId) {
    var resourceId = removedResource[0].resourceId
    var tierId = window.tierId
    var eventSlug = window.slug

    console.info(eventSlug, resourceId, tierId)

    Api.delete(`/resources/${eventSlug}`, { resourceId, tierId }).then(
      (res) => {
        console.info('RES', res)
      },
      (err) => {
        console.log('ERR', err)
      }
    )

  }

  this.update()
}

ResourcesController.prototype.update = function () {
  this.renderResources()
  this.updateTotal()

  if (this.cb instanceof Function) {
    this.cb(this.resourceType, this._resources, this.resourceTotal)
  }
}
