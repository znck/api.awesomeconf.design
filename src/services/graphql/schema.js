export default function createResolvers(instance) {
  const _base = instance.base(process.env.AIRTABLE_BASE_ID)
  const _tables = {}
  const db = name => _tables[name] || (_tables[name] = _base(name))
  const _columns = {
    proposals: {
      email: 'email',
      notes: '_notes',
      attachments: 'attachments',
      accepted: 'accepted',
      collaborator: 'collaborator',
      date: 'date',
      phone: 'phone',
      website: 'website',
      complexity: 'complexity',
      amount: 'amount',
      percentage: 'percentage',
      duration: 'duration',
      rating: 'rating',
      id: 'id',
    },
    requests: {
      email: 'Email',
      notes: 'Notes',
      attachments: 'Attachments',
      cfp: 'CFP',
    },
  }
  const api = {
    select(
      tableName,
      {
        limit: pageSize = 100,
        offset = 0,
        filter_by_formula: filterByFormula = '',
        order_by: sort = {},
      }
    ) {
      return db(tableName)
        .select({
          pageSize,
          filterByFormula,
          sort: Object.entries(sort).map(([field, direction]) => ({
            field,
            direction,
          })),
        })
        .firstPage()
    },
    find(tableName, { id }) {
      return db(tableName).find(id)
    },
    create(tableName, { fields = {} }) {
      return db(tableName).create(
        Object.entries(fields).reduce(
          (acc, [key, value]) => ((acc[_columns[tableName][key]] = value), acc),
          {}
        )
      )
    },
    update(tableName, { id, fields = {} }) {
      return db(tableName).update(
        id,
        Object.entries(fields).reduce(
          (acc, [key, value]) => ((acc[_columns[tableName][key]] = value), acc),
          {}
        )
      )
    },
    remove(tableName, { id }) {
      return db(tableName)
        .destroy(id)
        .then(result => result.destroyed)
        .catch(() => false)
    },
  }
  function createGetter(name) {
    return obj => obj[name]
  }

  function getColumnResolver(api, table, column) {
    switch (column.type) {
      case 'checkbox':
        return obj => obj._rawJson.fields[column.name] || false
      case 'foreignKey':
        return obj => {
          const ids = obj._rawJson.fields[column.name]
          if (column.options.relation === 'one') {
            if (!ids) return null
            return api.find(table, ids)
          } else {
            if (!Array.isArray(ids)) return []
            if (!ids.length) return []
            return Promise.all(ids.map(id => api.find(table, id)))
          }
        }
      case 'number':
        return obj => {
          const value = obj._rawJson.fields[column.name]
          if (column.options.format === 'currency') {
            return `${column.options.symbol}${value}`
          }
          if (
            column.options.format === 'percent' ||
            column.options.format === 'percentV2'
          ) {
            return `${value}%`
          }
          return value
        }
      case 'multiSelect':
        return obj => obj._rawJson.fields[column.name] || []
      default:
        return obj => obj._rawJson.fields[column.name]
    }
  }

  return {
    query_root: {
      proposals: (_, args) => api.select('proposals', args),
      proposal_by_pk: (_, args) => api.find('proposals', args),
      requests: (_, args) => api.select('requests', args),
      request_by_pk: (_, args) => api.find('requests', args),
    },
    mutation_root: {
      insert_proposal: (_, args) => api.create('proposals', args),
      update_proposal: (_, args) => api.update('proposals', args),
      delete_proposal: (_, args) => api.remove('proposals', args),
      insert_request: (_, args) => api.create('requests', args),
      update_request: (_, args) => api.update('requests', args),
      delete_request: (_, args) => api.remove('requests', args),
    },
    airtable_attachment_thumbnail: {
      url: createGetter('url'),
      height: createGetter('height'),
      width: createGetter('width'),
    },
    airtable_attachment_thumbnail_group: {
      small: createGetter('small'),
      large: createGetter('large'),
    },
    airtable_attachment: {
      id: createGetter('id'),
      size: createGetter('size'),
      url: createGetter('url'),
      type: createGetter('type'),
      filename: createGetter('filename'),
      thumbnails: createGetter('thumbnails'),
    },
    airtable_collaborator: {
      id: createGetter('id'),
      email: createGetter('email'),
      name: createGetter('name'),
    },
    proposals: {
      _id: obj => obj.id,
      _createdAt: obj => obj._rawJson.createdTime,
      email: getColumnResolver(api, 'proposals', {
        name: 'email',
        type: 'text',
        options: {},
      }),
      notes: getColumnResolver(api, 'proposals', {
        name: '_notes',
        type: 'multilineText',
        options: {},
      }),
      attachments: getColumnResolver(api, 'proposals', {
        name: 'attachments',
        type: 'multipleAttachment',
        options: {},
      }),
      accepted: getColumnResolver(api, 'proposals', {
        name: 'accepted',
        type: 'checkbox',
        options: {},
      }),
      collaborator: getColumnResolver(api, 'proposals', {
        name: 'collaborator',
        type: 'collaborator',
        options: {},
      }),
      date: getColumnResolver(api, 'proposals', {
        name: 'date',
        type: 'date',
        options: {},
      }),
      phone: getColumnResolver(api, 'proposals', {
        name: 'phone',
        type: 'phone',
        options: {},
      }),
      website: getColumnResolver(api, 'proposals', {
        name: 'website',
        type: 'text',
        options: {},
      }),
      complexity: getColumnResolver(api, 'proposals', {
        name: 'complexity',
        type: 'number',
        options: { format: 'decimal' },
      }),
      amount: getColumnResolver(api, 'proposals', {
        name: 'amount',
        type: 'number',
        options: { format: 'currency', symbol: '$' },
      }),
      percentage: getColumnResolver(api, 'proposals', {
        name: 'percentage',
        type: 'number',
        options: { format: 'percentV2' },
      }),
      duration: getColumnResolver(api, 'proposals', {
        name: 'duration',
        type: 'number',
        options: { format: 'duration' },
      }),
      rating: getColumnResolver(api, 'proposals', {
        name: 'rating',
        type: 'rating',
        options: {},
      }),
      id: getColumnResolver(api, 'proposals', {
        name: 'id',
        type: 'autoNumber',
        options: {},
      }),
    },
    requests: {
      _id: obj => obj.id,
      _createdAt: obj => obj._rawJson.createdTime,
      email: getColumnResolver(api, 'requests', {
        name: 'Email',
        type: 'text',
        options: {},
      }),
      notes: getColumnResolver(api, 'requests', {
        name: 'Notes',
        type: 'multilineText',
        options: {},
      }),
      attachments: getColumnResolver(api, 'requests', {
        name: 'Attachments',
        type: 'multipleAttachment',
        options: {},
      }),
      cfp: getColumnResolver(api, 'requests', {
        name: 'CFP',
        type: 'text',
        options: {},
      }),
    },
  }
}
